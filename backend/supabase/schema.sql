-- Tracker app — схема для Supabase (SQL Editor: New query → вставить весь файл → Run).
-- Если приложение пишет «не хватает таблицы или миграции» — используйте apply_fix.sql
-- (создаёт таблицы, мигрирует category → category_id, обновляет кэш API).
-- Политики RLS: перед каждым CREATE POLICY стоит DROP POLICY IF EXISTS — скрипт можно
-- выполнять повторно без ошибки «policy … already exists».
--
-- Что прогнать в Supabase:
--   Dashboard → ваш проект → SQL → New query → вставить содержимое этого файла → Run.
-- После успешного выполнения подождите ~1 минуту (обновление кэша API) и обновите приложение.
--
-- Требуется расширение для gen_random_uuid()

create extension if not exists "pgcrypto";

-- ─── profiles ─────────────────────────────────────────
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
  category_id uuid references public.categories (id) on delete set null,
  frequency jsonb not null,
  created_at timestamptz not null default now(),
  is_archived boolean not null default false
);

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
  type text not null,
  target_value numeric not null,
  current_value numeric not null default 0,
  unit text,
  deadline date not null,
  category_id uuid references public.categories (id) on delete set null,
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

-- ─── RLS ──────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.goals enable row level security;
alter table public.goal_progress enable row level security;
alter table public.food_items enable row level security;
alter table public.meal_entries enable row level security;
alter table public.nutrition_goals enable row level security;

-- Политики: перед CREATE — DROP, иначе повторный запуск скрипта падает (нет CREATE POLICY IF NOT EXISTS).

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

-- ─── Триггер: профиль + категории по умолчанию ───────
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
  );
  insert into public.categories (user_id, name, color, icon) values
    (new.id, 'Здоровье', '#22c55e', '💪'),
    (new.id, 'Спорт', '#3b82f6', '🏃'),
    (new.id, 'Образование', '#a855f7', '📚'),
    (new.id, 'Продуктивность', '#f59e0b', '⚡'),
    (new.id, 'Отдых', '#ec4899', '🧘'),
    (new.id, 'Финансы', '#14b8a6', '💰');
  insert into public.nutrition_goals (user_id, calories, protein, fat, carbs)
  values (new.id, 2200, 150, 70, 250);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Справочник продуктов (общий; при повторном запуске дубликаты по имени не добавляются) ───
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
