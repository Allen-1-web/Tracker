-- RLS: только authenticated; пользователь видит и меняет только свои строки.
-- Запуск: Supabase SQL Editor → New query → вставить файл → Run.
-- После выполнения: Settings → API → Reload schema (или подождать ~1 мин).

-- ─── Вспомогательная функция (опционально для будущих admin-политик) ───
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- ─── profiles ─────────────────────────────────────────
drop policy if exists "profiles own" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT в profiles — только триггер handle_new_user (security definer), не клиентом.

-- ─── categories ─────────────────────────────────────────
drop policy if exists "categories own" on public.categories;
drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

create policy "categories_select_own"
  on public.categories for select
  to authenticated
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on public.categories for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "categories_update_own"
  on public.categories for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_delete_own"
  on public.categories for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── habits ─────────────────────────────────────────────
drop policy if exists "habits own" on public.habits;
drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;

create policy "habits_select_own"
  on public.habits for select
  to authenticated
  using (auth.uid() = user_id);

create policy "habits_insert_own"
  on public.habits for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "habits_update_own"
  on public.habits for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habits_delete_own"
  on public.habits for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── habit_logs (колонка habit_id — если отсутствует в старой БД) ───
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'habit_logs'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'habit_logs' and column_name = 'habit_id'
  ) then
    alter table public.habit_logs
      add column habit_id uuid references public.habits (id) on delete cascade;
  end if;
end $$;

drop policy if exists "habit_logs own" on public.habit_logs;
drop policy if exists "habit_logs_select_own" on public.habit_logs;
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
drop policy if exists "habit_logs_update_own" on public.habit_logs;
drop policy if exists "habit_logs_delete_own" on public.habit_logs;

create policy "habit_logs_select_own"
  on public.habit_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "habit_logs_insert_own"
  on public.habit_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "habit_logs_update_own"
  on public.habit_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habit_logs_delete_own"
  on public.habit_logs for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── goals ──────────────────────────────────────────────
drop policy if exists "goals own" on public.goals;
drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;

create policy "goals_select_own"
  on public.goals for select
  to authenticated
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── goal_progress ──────────────────────────────────────
drop policy if exists "goal_progress own" on public.goal_progress;
drop policy if exists "goal_progress_select_own" on public.goal_progress;
drop policy if exists "goal_progress_insert_own" on public.goal_progress;
drop policy if exists "goal_progress_update_own" on public.goal_progress;
drop policy if exists "goal_progress_delete_own" on public.goal_progress;

create policy "goal_progress_select_own"
  on public.goal_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "goal_progress_insert_own"
  on public.goal_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "goal_progress_update_own"
  on public.goal_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goal_progress_delete_own"
  on public.goal_progress for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── food_items (справочник, только чтение) ─────────────
drop policy if exists "food_items read" on public.food_items;
drop policy if exists "food_items_select_authenticated" on public.food_items;

create policy "food_items_select_authenticated"
  on public.food_items for select
  to authenticated
  using (true);

-- ─── meal_entries ───────────────────────────────────────
drop policy if exists "meal_entries own" on public.meal_entries;
drop policy if exists "meal_entries_select_own" on public.meal_entries;
drop policy if exists "meal_entries_insert_own" on public.meal_entries;
drop policy if exists "meal_entries_update_own" on public.meal_entries;
drop policy if exists "meal_entries_delete_own" on public.meal_entries;

create policy "meal_entries_select_own"
  on public.meal_entries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "meal_entries_insert_own"
  on public.meal_entries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "meal_entries_update_own"
  on public.meal_entries for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meal_entries_delete_own"
  on public.meal_entries for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── nutrition_goals ────────────────────────────────────
drop policy if exists "nutrition_goals own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_select_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_insert_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_update_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_delete_own" on public.nutrition_goals;

create policy "nutrition_goals_select_own"
  on public.nutrition_goals for select
  to authenticated
  using (auth.uid() = user_id);

create policy "nutrition_goals_insert_own"
  on public.nutrition_goals for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "nutrition_goals_update_own"
  on public.nutrition_goals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nutrition_goals_delete_own"
  on public.nutrition_goals for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
