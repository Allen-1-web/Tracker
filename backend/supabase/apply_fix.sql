-- ═══════════════════════════════════════════════════════════════════════════
-- Tracker — один скрипт для Supabase SQL Editor (New query → вставить → Run)
-- Исправляет: отсутствующие таблицы, колонку category_id, политики RLS.
-- Безопасно запускать повторно.
-- После Run: подождите 1–2 минуты, обновите приложение (Ctrl+F5).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Таблицы (если ещё не созданы) ─────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  telegram_connected boolean not null default false,
  telegram_username text,
  theme text not null default 'light',
  reminder_time text,
  reminders_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  frequency jsonb not null default '"daily"'::jsonb,
  created_at timestamptz not null default now(),
  is_archived boolean not null default false
);

-- legacy habit_logs (id, task_id, completed_at) → log_date/completed
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'habit_logs' and column_name = 'completed_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'habit_logs' and column_name = 'log_date'
  ) then
    create table public.habit_logs_new (
      habit_id uuid not null references public.habits (id) on delete cascade,
      user_id uuid not null references auth.users (id) on delete cascade,
      log_date date not null,
      completed boolean not null default true,
      primary key (habit_id, log_date)
    );

    insert into public.habit_logs_new (habit_id, user_id, log_date, completed)
    select distinct on (hl.habit_id, hl.user_id, (hl.completed_at at time zone 'UTC')::date)
      hl.habit_id,
      hl.user_id,
      (hl.completed_at at time zone 'UTC')::date,
      true
    from public.habit_logs hl
    where hl.habit_id is not null
      and hl.completed_at is not null
      and exists (select 1 from public.habits h where h.id = hl.habit_id)
    order by hl.habit_id, hl.user_id, (hl.completed_at at time zone 'UTC')::date, hl.completed_at desc;

    drop table public.habit_logs cascade;
    alter table public.habit_logs_new rename to habit_logs;
    alter table public.habit_logs enable row level security;
  end if;
end $$;

create table if not exists public.habit_logs (
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  primary key (habit_id, log_date)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  type text not null default 'numeric',
  target_value numeric not null,
  current_value numeric not null default 0,
  unit text,
  deadline date not null,
  linked_habit_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.goal_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  progress_date date not null,
  value numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories numeric not null,
  protein numeric not null,
  fat numeric not null,
  carbs numeric not null,
  category text not null
);

create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null references public.food_items (id) on delete restrict,
  entry_date date not null,
  meal_type text not null,
  amount numeric not null,
  calories numeric not null,
  protein numeric not null,
  fat numeric not null,
  carbs numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.nutrition_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calories numeric not null,
  protein numeric not null,
  fat numeric not null,
  carbs numeric not null
);

-- ─── Добавить недостающие колонки (если таблицы созданы раньше по другой схеме) ─

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists telegram_connected boolean not null default false;
alter table public.profiles add column if not exists telegram_username text;
alter table public.profiles add column if not exists theme text not null default 'light';
alter table public.profiles add column if not exists reminder_time text;
alter table public.profiles add column if not exists reminders_enabled boolean not null default true;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.habits add column if not exists name text;
alter table public.habits add column if not exists icon text;
alter table public.habits add column if not exists color text;
alter table public.habits add column if not exists frequency jsonb default '"daily"'::jsonb;
alter table public.habits add column if not exists created_at timestamptz default now();
alter table public.habits add column if not exists is_archived boolean default false;

alter table public.goals add column if not exists name text;
alter table public.goals add column if not exists title text;
alter table public.goals add column if not exists description text;
alter table public.goals add column if not exists type text default 'numeric';
alter table public.goals add column if not exists target_value numeric default 1;
alter table public.goals add column if not exists current_value numeric default 0;
alter table public.goals add column if not exists unit text;
alter table public.goals add column if not exists deadline date default current_date;
alter table public.goals add column if not exists linked_habit_ids uuid[] default '{}';
alter table public.goals add column if not exists created_at timestamptz default now();

-- Заполнить пустые обязательные поля у старых строк
update public.habits set name = 'Привычка' where name is null;
update public.habits set icon = '🏋️' where icon is null;
update public.habits set color = '#6366f1' where color is null;
update public.habits set frequency = '"daily"'::jsonb where frequency is null;
update public.habits set is_archived = false where is_archived is null;

update public.goals set name = title where (name is null or name = '') and title is not null;
update public.goals set title = name where (title is null or title = '') and name is not null;
update public.goals set name = coalesce(name, title, 'Цель'), title = coalesce(title, name, 'Цель');
update public.goals set type = 'numeric' where type is null;
update public.goals set target_value = 1 where target_value is null;
update public.goals set current_value = 0 where current_value is null;
update public.goals set deadline = current_date where deadline is null;
update public.goals set linked_habit_ids = '{}' where linked_habit_ids is null;

-- ─── Миграция category → category_id ───────────────────────────────────────

alter table public.habits
  add column if not exists category_id uuid references public.categories (id) on delete set null;

alter table public.goals
  add column if not exists category_id uuid references public.categories (id) on delete set null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'habits' and column_name = 'category'
  ) then
    update public.habits h
    set category_id = c.id
    from public.categories c
    where c.user_id = h.user_id and c.name = h.category and h.category_id is null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'goals' and column_name = 'category'
  ) then
    update public.goals g
    set category_id = c.id
    from public.categories c
    where c.user_id = g.user_id and c.name = g.category and g.category_id is null;
  end if;
end $$;

alter table public.habits drop column if exists category;
alter table public.goals drop column if exists category;

-- ─── RLS ───────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.goals enable row level security;
alter table public.goal_progress enable row level security;
alter table public.food_items enable row level security;
alter table public.meal_entries enable row level security;
alter table public.nutrition_goals enable row level security;

drop policy if exists "profiles own" on public.profiles;
create policy "profiles own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "categories own" on public.categories;
create policy "categories own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habits own" on public.habits;
create policy "habits own" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habit_logs own" on public.habit_logs;
create policy "habit_logs own" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals own" on public.goals;
create policy "goals own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goal_progress own" on public.goal_progress;
create policy "goal_progress own" on public.goal_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "food_items read" on public.food_items;
create policy "food_items read" on public.food_items for select to authenticated using (true);

drop policy if exists "meal_entries own" on public.meal_entries;
create policy "meal_entries own" on public.meal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "nutrition_goals own" on public.nutrition_goals;
create policy "nutrition_goals own" on public.nutrition_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Заполнить name/email у уже существующих профилей
update public.profiles p
set
  name = coalesce(
    p.name,
    (select coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
     from auth.users u where u.id = p.id)
  ),
  email = coalesce(p.email, (select u.email from auth.users u where u.id = p.id))
where p.name is null or p.email is null;

-- ─── Профиль и категории для уже зарегистрированных пользователей ─────────

insert into public.profiles (id, name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.categories (user_id, name, color, icon)
select u.id, v.name, v.color, v.icon
from auth.users u
cross join (
  values
    ('Здоровье', '#22c55e', '💪'),
    ('Спорт', '#3b82f6', '🏃'),
    ('Образование', '#a855f7', '📚'),
    ('Продуктивность', '#f59e0b', '⚡'),
    ('Отдых', '#ec4899', '🧘'),
    ('Финансы', '#14b8a6', '💰')
) as v(name, color, icon)
where not exists (
  select 1 from public.categories c where c.user_id = u.id and c.name = v.name
);

insert into public.nutrition_goals (user_id, calories, protein, fat, carbs)
select u.id, 2200, 150, 70, 250
from auth.users u
where not exists (select 1 from public.nutrition_goals n where n.user_id = u.id);

-- ─── Триггер для новых пользователей ───────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, color, icon) values
    (new.id, 'Здоровье', '#22c55e', '💪'),
    (new.id, 'Спорт', '#3b82f6', '🏃'),
    (new.id, 'Образование', '#a855f7', '📚'),
    (new.id, 'Продуктивность', '#f59e0b', '⚡'),
    (new.id, 'Отдых', '#ec4899', '🧘'),
    (new.id, 'Финансы', '#14b8a6', '💰');

  insert into public.nutrition_goals (user_id, calories, protein, fat, carbs)
  values (new.id, 2200, 150, 70, 250)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Справочник продуктов ──────────────────────────────────────────────────

insert into public.food_items (name, calories, protein, fat, carbs, category)
select v.name, v.calories, v.protein, v.fat, v.carbs, v.category
from (
  values
    ('Куриная грудка (варёная)', 165::numeric, 31::numeric, 3.6::numeric, 0::numeric, 'proteins'),
    ('Яйцо куриное', 155, 13, 11, 1.1, 'proteins'),
    ('Лосось (запечённый)', 208, 20, 13, 0, 'proteins'),
    ('Говядина (тушёная)', 218, 26, 12, 0, 'proteins'),
    ('Тунец (консервированный)', 116, 26, 1, 0, 'proteins'),
    ('Творог 5%', 121, 17, 5, 3, 'dairy'),
    ('Рис (варёный)', 130, 2.7, 0.3, 28, 'grains'),
    ('Гречка (варёная)', 110, 4, 1, 21, 'grains'),
    ('Овсянка на воде', 88, 3, 1.5, 15, 'grains'),
    ('Хлеб цельнозерновой', 247, 9, 3, 45, 'grains'),
    ('Макароны (варёные)', 158, 5.5, 0.9, 31, 'grains'),
    ('Молоко 2.5%', 52, 2.8, 2.5, 4.7, 'dairy'),
    ('Греческий йогурт 2%', 73, 10, 2, 4, 'dairy'),
    ('Сыр чеддер', 402, 25, 33, 1.3, 'dairy'),
    ('Брокколи', 34, 2.8, 0.4, 7, 'vegetables'),
    ('Огурец', 15, 0.7, 0.1, 3.6, 'vegetables'),
    ('Помидор', 18, 0.9, 0.2, 3.9, 'vegetables'),
    ('Картофель (варёный)', 86, 2, 0.1, 20, 'vegetables'),
    ('Морковь', 41, 0.9, 0.2, 10, 'vegetables'),
    ('Яблоко', 52, 0.3, 0.2, 14, 'fruits'),
    ('Банан', 89, 1.1, 0.3, 23, 'fruits'),
    ('Апельсин', 47, 0.9, 0.1, 12, 'fruits'),
    ('Черника', 57, 0.7, 0.3, 14, 'fruits'),
    ('Авокадо', 160, 2, 15, 9, 'fats'),
    ('Миндаль', 579, 21, 50, 22, 'fats'),
    ('Оливковое масло', 884, 0, 100, 0, 'fats'),
    ('Кофе чёрный', 2, 0.3, 0, 0, 'drinks'),
    ('Апельсиновый сок', 45, 0.7, 0.2, 10, 'drinks'),
    ('Шоколад тёмный 70%', 598, 7, 43, 46, 'sweets'),
    ('Мёд', 304, 0.3, 0, 82, 'sweets')
) as v(name, calories, protein, fat, carbs, category)
where not exists (select 1 from public.food_items f where f.name = v.name);

-- Обновить кэш API PostgREST (Supabase)
-- goals: синхронизация title (старая схема) и name (приложение)
alter table public.goals alter column title drop not null;

create or replace function public.goals_sync_name_title()
returns trigger
language plpgsql
as $$
begin
  if new.name is not null and (new.title is null or new.title = '') then
    new.title := new.name;
  elsif new.title is not null and (new.name is null or new.name = '') then
    new.name := new.title;
  end if;
  return new;
end;
$$;

drop trigger if exists goals_sync_name_title on public.goals;
create trigger goals_sync_name_title
  before insert or update on public.goals
  for each row execute function public.goals_sync_name_title();

notify pgrst, 'reload schema';
