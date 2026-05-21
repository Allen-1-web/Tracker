-- CHECK constraints и индексы для валидации на уровне БД.
-- Безопасно запускать повторно (IF NOT EXISTS / DROP IF EXISTS).

-- ─── goals ──────────────────────────────────────────────
alter table public.goals drop constraint if exists goals_name_length;
alter table public.goals add constraint goals_name_length
  check (char_length(trim(name)) >= 3 and char_length(name) <= 120);

alter table public.goals drop constraint if exists goals_description_length;
alter table public.goals add constraint goals_description_length
  check (description is null or char_length(description) <= 1000);

alter table public.goals drop constraint if exists goals_type_check;
alter table public.goals add constraint goals_type_check
  check (type in ('numeric', 'binary'));

alter table public.goals drop constraint if exists goals_target_positive;
alter table public.goals add constraint goals_target_positive
  check (target_value > 0);

alter table public.goals drop constraint if exists goals_current_non_negative;
alter table public.goals add constraint goals_current_non_negative
  check (current_value >= 0);

alter table public.goals drop constraint if exists goals_current_lte_target;
alter table public.goals add constraint goals_current_lte_target
  check (current_value <= target_value);

alter table public.goals drop constraint if exists goals_unit_length;
alter table public.goals add constraint goals_unit_length
  check (unit is null or char_length(unit) <= 20);

-- ─── habits (tasks в ТЗ) ──────────────────────────────
alter table public.habits drop constraint if exists habits_name_length;
alter table public.habits add constraint habits_name_length
  check (char_length(trim(name)) >= 3 and char_length(name) <= 120);

-- ─── habit_logs ─────────────────────────────────────────
-- PK (habit_id, log_date) гарантирует одну запись в день

-- ─── goal_progress (notes) ──────────────────────────────
alter table public.goal_progress drop constraint if exists goal_progress_value_non_negative;
alter table public.goal_progress add constraint goal_progress_value_non_negative
  check (value >= 0);

alter table public.goal_progress drop constraint if exists goal_progress_note_length;
alter table public.goal_progress add constraint goal_progress_note_length
  check (note is null or char_length(note) <= 500);

-- ─── meal_entries (food_entries) ────────────────────────
alter table public.meal_entries drop constraint if exists meal_entries_meal_type_check;
alter table public.meal_entries add constraint meal_entries_meal_type_check
  check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack'));

alter table public.meal_entries drop constraint if exists meal_entries_amount_positive;
alter table public.meal_entries add constraint meal_entries_amount_positive
  check (amount > 0);

alter table public.meal_entries drop constraint if exists meal_entries_calories_non_negative;
alter table public.meal_entries add constraint meal_entries_calories_non_negative
  check (calories >= 0);

alter table public.meal_entries drop constraint if exists meal_entries_protein_non_negative;
alter table public.meal_entries add constraint meal_entries_protein_non_negative
  check (protein >= 0);

alter table public.meal_entries drop constraint if exists meal_entries_fat_non_negative;
alter table public.meal_entries add constraint meal_entries_fat_non_negative
  check (fat >= 0);

alter table public.meal_entries drop constraint if exists meal_entries_carbs_non_negative;
alter table public.meal_entries add constraint meal_entries_carbs_non_negative
  check (carbs >= 0);

-- ─── profiles ─────────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_name_length;
alter table public.profiles add constraint profiles_name_length
  check (name is null or (char_length(trim(name)) >= 3 and char_length(name) <= 30));

alter table public.profiles drop constraint if exists profiles_theme_check;
alter table public.profiles add constraint profiles_theme_check
  check (theme in ('light', 'dark', 'system'));

alter table public.profiles drop constraint if exists profiles_reminder_time_format;
alter table public.profiles add constraint profiles_reminder_time_format
  check (
    reminder_time is null
    or reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  );

-- ─── nutrition_goals (kcal_goal и макросы) ──────────────
alter table public.nutrition_goals drop constraint if exists nutrition_goals_calories_range;
alter table public.nutrition_goals add constraint nutrition_goals_calories_range
  check (calories >= 1000 and calories <= 10000);

alter table public.nutrition_goals drop constraint if exists nutrition_goals_protein_range;
alter table public.nutrition_goals add constraint nutrition_goals_protein_range
  check (protein >= 0 and protein <= 1000);

alter table public.nutrition_goals drop constraint if exists nutrition_goals_fat_range;
alter table public.nutrition_goals add constraint nutrition_goals_fat_range
  check (fat >= 0 and fat <= 1000);

alter table public.nutrition_goals drop constraint if exists nutrition_goals_carbs_range;
alter table public.nutrition_goals add constraint nutrition_goals_carbs_range
  check (carbs >= 0 and carbs <= 2000);

-- ─── categories ─────────────────────────────────────────
alter table public.categories drop constraint if exists categories_name_length;
alter table public.categories add constraint categories_name_length
  check (char_length(trim(name)) >= 1 and char_length(name) <= 40);

-- ─── indexes (частые фильтры по user_id / дате) ─────────
create index if not exists habits_user_id_idx on public.habits (user_id);
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists meal_entries_user_date_idx on public.meal_entries (user_id, entry_date);
create index if not exists goal_progress_goal_date_idx on public.goal_progress (goal_id, progress_date);

notify pgrst, 'reload schema';
