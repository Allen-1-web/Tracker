-- 20260524_telegram_integration.sql
-- Telegram bot integration: link, sessions, reminders, notifications.
--
-- Безопасно повторно (idempotent): все CREATE IF NOT EXISTS, политики через DROP IF EXISTS.
-- Запуск: Supabase Dashboard → SQL Editor → New query → вставить → Run.

create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────
-- 1) telegram_users — связка user_id ↔ chat_id, TZ, quiet hours
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.telegram_users (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  telegram_chat_id   bigint not null unique,
  telegram_user_id   bigint not null,
  username           text,
  first_name         text,
  last_name          text,
  language_code      text,
  timezone           text not null default 'UTC',
  quiet_hours_start  time,
  quiet_hours_end    time,
  is_blocked         boolean not null default false,
  linked_at          timestamptz not null default now(),
  last_seen_at       timestamptz,
  constraint telegram_users_tz_valid check (length(timezone) between 1 and 64),
  constraint telegram_users_quiet_pair check (
    (quiet_hours_start is null and quiet_hours_end is null)
    or (quiet_hours_start is not null and quiet_hours_end is not null)
  )
);

create index if not exists telegram_users_chat_id_idx on public.telegram_users (telegram_chat_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 2) telegram_link_tokens — одноразовые токены связи (TTL 10 мин)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.telegram_link_tokens (
  token       text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now(),
  constraint telegram_link_tokens_token_len check (length(token) between 16 and 128)
);

create index if not exists telegram_link_tokens_user_idx on public.telegram_link_tokens (user_id);
create index if not exists telegram_link_tokens_expires_idx on public.telegram_link_tokens (expires_at) where used_at is null;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) telegram_sessions — состояние диалогов (multi-step flows)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.telegram_sessions (
  chat_id    bigint primary key,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────────────
-- 4) notification_preferences — per-user тогглы
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_preferences (
  user_id                       uuid primary key references auth.users (id) on delete cascade,
  daily_summary                 boolean not null default true,
  daily_summary_time            time    not null default '20:00',
  weekly_report                 boolean not null default true,
  weekly_report_dow             smallint not null default 0,         -- 0 = воскресенье
  weekly_report_time            time    not null default '20:00',
  hydration                     boolean not null default false,
  hydration_interval_minutes    smallint not null default 120,
  hydration_start_time          time    not null default '09:00',
  hydration_end_time            time    not null default '21:00',
  nutrition_reminders           boolean not null default true,
  habit_reminders               boolean not null default true,
  goal_deadline_reminders       boolean not null default true,
  missed_habit_alerts           boolean not null default true,
  updated_at                    timestamptz not null default now(),
  constraint notification_prefs_dow_range check (weekly_report_dow between 0 and 6),
  constraint notification_prefs_hydration_interval check (
    hydration_interval_minutes between 15 and 1440
  )
);

-- ───────────────────────────────────────────────────────────────────────────
-- 5) reminder_schedules — cron-based пользовательские напоминания
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.reminder_schedules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (
    kind in ('habit','goal','nutrition','water','sleep','workout','custom')
  ),
  ref_id      uuid,                                             -- e.g. habit_id, goal_id (nullable для water/sleep/custom)
  title       text not null,
  message     text,
  cron        text not null,                                    -- 5-field cron в TZ пользователя
  timezone    text not null,
  enabled     boolean not null default true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint reminder_schedules_title_len check (length(title) between 1 and 200),
  constraint reminder_schedules_message_len check (message is null or length(message) <= 1000),
  constraint reminder_schedules_cron_len check (length(cron) between 9 and 100),
  constraint reminder_schedules_tz_len check (length(timezone) between 1 and 64)
);

create index if not exists reminder_schedules_user_enabled_idx
  on public.reminder_schedules (user_id, enabled);
create index if not exists reminder_schedules_next_run_idx
  on public.reminder_schedules (next_run_at) where enabled = true;
create index if not exists reminder_schedules_kind_ref_idx
  on public.reminder_schedules (kind, ref_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6) notification_logs — аудит/идемпотентность
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  reminder_id  uuid references public.reminder_schedules (id) on delete set null,
  kind         text not null,
  channel      text not null default 'telegram',
  status       text not null check (
    status in ('queued','sent','failed','skipped_quiet_hours','skipped_disabled','skipped_blocked')
  ),
  payload      jsonb,
  error        text,
  attempt      smallint not null default 1,
  created_at   timestamptz not null default now()
);

create index if not exists notification_logs_user_created_idx
  on public.notification_logs (user_id, created_at desc);
create index if not exists notification_logs_reminder_idx
  on public.notification_logs (reminder_id, created_at desc);
create index if not exists notification_logs_status_idx
  on public.notification_logs (status) where status in ('failed','queued');

-- ───────────────────────────────────────────────────────────────────────────
-- RLS
-- ───────────────────────────────────────────────────────────────────────────
alter table public.telegram_users           enable row level security;
alter table public.telegram_link_tokens     enable row level security;
alter table public.telegram_sessions        enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reminder_schedules       enable row level security;
alter table public.notification_logs        enable row level security;

-- telegram_users: пользователь видит свою связку, write — только service_role (бот).
drop policy if exists "telegram_users_select_own" on public.telegram_users;
create policy "telegram_users_select_own" on public.telegram_users
  for select to authenticated using (auth.uid() = user_id);

-- TZ/quiet hours пользователь меняет через API (бот обновляет через service_role).
drop policy if exists "telegram_users_update_own_prefs" on public.telegram_users;
create policy "telegram_users_update_own_prefs" on public.telegram_users
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- telegram_link_tokens: пользователь создаёт/читает свои. Удаляет бот (service_role).
drop policy if exists "telegram_link_tokens_select_own" on public.telegram_link_tokens;
drop policy if exists "telegram_link_tokens_insert_own" on public.telegram_link_tokens;
create policy "telegram_link_tokens_select_own" on public.telegram_link_tokens
  for select to authenticated using (auth.uid() = user_id);
create policy "telegram_link_tokens_insert_own" on public.telegram_link_tokens
  for insert to authenticated with check (auth.uid() = user_id);

-- telegram_sessions: только service_role.
-- (Намеренно нет политик для authenticated → доступ закрыт.)

-- notification_preferences: пользователь полностью управляет своими.
drop policy if exists "notification_prefs_select_own" on public.notification_preferences;
drop policy if exists "notification_prefs_insert_own" on public.notification_preferences;
drop policy if exists "notification_prefs_update_own" on public.notification_preferences;
create policy "notification_prefs_select_own" on public.notification_preferences
  for select to authenticated using (auth.uid() = user_id);
create policy "notification_prefs_insert_own" on public.notification_preferences
  for insert to authenticated with check (auth.uid() = user_id);
create policy "notification_prefs_update_own" on public.notification_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reminder_schedules: full CRUD для владельца.
drop policy if exists "reminders_select_own" on public.reminder_schedules;
drop policy if exists "reminders_insert_own" on public.reminder_schedules;
drop policy if exists "reminders_update_own" on public.reminder_schedules;
drop policy if exists "reminders_delete_own" on public.reminder_schedules;
create policy "reminders_select_own" on public.reminder_schedules
  for select to authenticated using (auth.uid() = user_id);
create policy "reminders_insert_own" on public.reminder_schedules
  for insert to authenticated with check (auth.uid() = user_id);
create policy "reminders_update_own" on public.reminder_schedules
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_delete_own" on public.reminder_schedules
  for delete to authenticated using (auth.uid() = user_id);

-- notification_logs: пользователь только читает свои. Запись — service_role.
drop policy if exists "notification_logs_select_own" on public.notification_logs;
create policy "notification_logs_select_own" on public.notification_logs
  for select to authenticated using (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- Триггеры
-- ───────────────────────────────────────────────────────────────────────────

-- Авто-обновление updated_at в reminder_schedules.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reminder_schedules_touch_updated_at on public.reminder_schedules;
create trigger reminder_schedules_touch_updated_at
  before update on public.reminder_schedules
  for each row execute function public.touch_updated_at();

drop trigger if exists notification_prefs_touch_updated_at on public.notification_preferences;
create trigger notification_prefs_touch_updated_at
  before update on public.notification_preferences
  for each row execute function public.touch_updated_at();

drop trigger if exists telegram_sessions_touch_updated_at on public.telegram_sessions;
create trigger telegram_sessions_touch_updated_at
  before update on public.telegram_sessions
  for each row execute function public.touch_updated_at();

-- Синхронизация profiles.telegram_connected / telegram_username по telegram_users.
create or replace function public.sync_profile_telegram()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles
       set telegram_connected = true,
           telegram_username  = new.username
     where id = new.user_id;
  elsif (tg_op = 'UPDATE') then
    update public.profiles
       set telegram_username = new.username
     where id = new.user_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles
       set telegram_connected = false,
           telegram_username  = null
     where id = old.user_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists telegram_users_sync_profile on public.telegram_users;
create trigger telegram_users_sync_profile
  after insert or update or delete on public.telegram_users
  for each row execute function public.sync_profile_telegram();

-- Авто-создание notification_preferences для нового пользователя
-- (обновляем существующий триггер handle_new_user — добавим строку через отдельную функцию-обёртку,
-- чтобы не переписывать всю функцию: ниже идемпотентный INSERT при первом обращении).
create or replace function public.ensure_notification_prefs(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Пересоздаём handle_new_user, добавляя дефолтные настройки уведомлений.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, color, icon) values
    (new.id, 'Здоровье', '#22c55e', '💪'),
    (new.id, 'Спорт', '#3b82f6', '🏃'),
    (new.id, 'Образование', '#a855f7', '📚'),
    (new.id, 'Продуктивность', '#f59e0b', '⚡'),
    (new.id, 'Отдых', '#ec4899', '🧘'),
    (new.id, 'Финансы', '#14b8a6', '💰')
  on conflict do nothing;

  insert into public.nutrition_goals (user_id, calories, protein, fat, carbs)
  values (new.id, 2200, 150, 70, 250)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────────────────────────────────────
-- Backfill для существующих пользователей
-- ───────────────────────────────────────────────────────────────────────────
insert into public.notification_preferences (user_id)
select id from public.profiles
where not exists (
  select 1 from public.notification_preferences np where np.user_id = profiles.id
);
