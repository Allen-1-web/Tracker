-- Roles, admin RLS, ownership checks, role-escalation guard, security audit log.
-- Run after 20260521_rls_auth_policies.sql and 20260522_validation_constraints.sql.

-- ─── profiles.role ───────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin'));

create index if not exists profiles_role_idx on public.profiles (role);

-- ─── Helpers ─────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.user_owns_category(category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select category_id is null
    or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = auth.uid()
    );
$$;

revoke all on function public.user_owns_category(uuid) from public;
grant execute on function public.user_owns_category(uuid) to authenticated;

create or replace function public.user_owns_habit(habit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.habits h
    where h.id = habit_id and h.user_id = auth.uid()
  );
$$;

revoke all on function public.user_owns_habit(uuid) from public;
grant execute on function public.user_owns_habit(uuid) to authenticated;

create or replace function public.user_owns_goal(goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = auth.uid()
  );
$$;

revoke all on function public.user_owns_goal(uuid) from public;
grant execute on function public.user_owns_goal(uuid) to authenticated;

-- ─── Role escalation guard ───────────────────────────────
create or replace function public.profiles_enforce_role_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SQL Editor / service (нет JWT): разрешить bootstrap первого admin
  if auth.uid() is null then
    return new;
  end if;
  if not public.is_admin() and new.role is distinct from old.role then
    raise exception 'permission_denied: cannot change role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.profiles_enforce_role_immutable();

-- ─── Bootstrap: default role on signup ───────────────────
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
  );
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

-- ─── Security audit log ──────────────────────────────────
create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.security_audit_log enable row level security;

drop policy if exists "security_audit_log_insert_own" on public.security_audit_log;
drop policy if exists "security_audit_log_select_admin" on public.security_audit_log;

create policy "security_audit_log_insert_own"
  on public.security_audit_log for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "security_audit_log_select_admin"
  on public.security_audit_log for select
  to authenticated
  using (public.is_admin());

-- ─── Admin RPC: change user role ─────────────────────────
create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'permission_denied: admin only' using errcode = '42501';
  end if;
  if new_role not in ('user', 'admin') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  if target_user_id = auth.uid() and new_role <> 'admin' then
    raise exception 'permission_denied: cannot demote yourself' using errcode = '42501';
  end if;

  update public.profiles
  set role = new_role, updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  insert into public.security_audit_log (user_id, action, resource, details)
  values (
    auth.uid(),
    'admin_set_user_role',
    'profiles',
    jsonb_build_object('target_user_id', target_user_id, 'new_role', new_role)
  );
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- ─── Drop legacy policies ────────────────────────────────
drop policy if exists "profiles own" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

drop policy if exists "categories own" on public.categories;
drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

drop policy if exists "habits own" on public.habits;
drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;

drop policy if exists "habit_logs own" on public.habit_logs;
drop policy if exists "habit_logs_select_own" on public.habit_logs;
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
drop policy if exists "habit_logs_update_own" on public.habit_logs;
drop policy if exists "habit_logs_delete_own" on public.habit_logs;

drop policy if exists "goals own" on public.goals;
drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;

drop policy if exists "goal_progress own" on public.goal_progress;
drop policy if exists "goal_progress_select_own" on public.goal_progress;
drop policy if exists "goal_progress_insert_own" on public.goal_progress;
drop policy if exists "goal_progress_update_own" on public.goal_progress;
drop policy if exists "goal_progress_delete_own" on public.goal_progress;

drop policy if exists "meal_entries own" on public.meal_entries;
drop policy if exists "meal_entries_select_own" on public.meal_entries;
drop policy if exists "meal_entries_insert_own" on public.meal_entries;
drop policy if exists "meal_entries_update_own" on public.meal_entries;
drop policy if exists "meal_entries_delete_own" on public.meal_entries;

drop policy if exists "nutrition_goals own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_select_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_insert_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_update_own" on public.nutrition_goals;
drop policy if exists "nutrition_goals_delete_own" on public.nutrition_goals;

-- ─── Drop policies from повторного запуска 20260523 ─────
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

drop policy if exists "categories_select" on public.categories;
drop policy if exists "categories_insert" on public.categories;
drop policy if exists "categories_update" on public.categories;
drop policy if exists "categories_delete" on public.categories;

drop policy if exists "habits_select" on public.habits;
drop policy if exists "habits_insert" on public.habits;
drop policy if exists "habits_update" on public.habits;
drop policy if exists "habits_delete" on public.habits;

drop policy if exists "habit_logs_select" on public.habit_logs;
drop policy if exists "habit_logs_insert" on public.habit_logs;
drop policy if exists "habit_logs_update" on public.habit_logs;
drop policy if exists "habit_logs_delete" on public.habit_logs;

drop policy if exists "goals_select" on public.goals;
drop policy if exists "goals_insert" on public.goals;
drop policy if exists "goals_update" on public.goals;
drop policy if exists "goals_delete" on public.goals;

drop policy if exists "goal_progress_select" on public.goal_progress;
drop policy if exists "goal_progress_insert" on public.goal_progress;
drop policy if exists "goal_progress_update" on public.goal_progress;
drop policy if exists "goal_progress_delete" on public.goal_progress;

drop policy if exists "meal_entries_select" on public.meal_entries;
drop policy if exists "meal_entries_insert" on public.meal_entries;
drop policy if exists "meal_entries_update" on public.meal_entries;
drop policy if exists "meal_entries_delete" on public.meal_entries;

drop policy if exists "nutrition_goals_select" on public.nutrition_goals;
drop policy if exists "nutrition_goals_insert" on public.nutrition_goals;
drop policy if exists "nutrition_goals_update" on public.nutrition_goals;
drop policy if exists "nutrition_goals_delete" on public.nutrition_goals;

-- ─── profiles ────────────────────────────────────────────
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── categories ──────────────────────────────────────────
create policy "categories_select"
  on public.categories for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "categories_insert"
  on public.categories for insert to authenticated
  with check (
    (auth.uid() = user_id) or public.is_admin()
  );

create policy "categories_update"
  on public.categories for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "categories_delete"
  on public.categories for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ─── habits (tasks) ──────────────────────────────────────
create policy "habits_select"
  on public.habits for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "habits_insert"
  on public.habits for insert to authenticated
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_category(category_id)
    )
  );

create policy "habits_update"
  on public.habits for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_category(category_id)
    )
  );

create policy "habits_delete"
  on public.habits for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ─── habit_logs ──────────────────────────────────────────
create policy "habit_logs_select"
  on public.habit_logs for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "habit_logs_insert"
  on public.habit_logs for insert to authenticated
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_habit(habit_id)
    )
  );

create policy "habit_logs_update"
  on public.habit_logs for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_habit(habit_id)
    )
  );

create policy "habit_logs_delete"
  on public.habit_logs for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ─── goals ───────────────────────────────────────────────
create policy "goals_select"
  on public.goals for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "goals_insert"
  on public.goals for insert to authenticated
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_category(category_id)
    )
  );

create policy "goals_update"
  on public.goals for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_category(category_id)
    )
  );

create policy "goals_delete"
  on public.goals for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ─── goal_progress (notes) ───────────────────────────────
create policy "goal_progress_select"
  on public.goal_progress for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "goal_progress_insert"
  on public.goal_progress for insert to authenticated
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_goal(goal_id)
    )
  );

create policy "goal_progress_update"
  on public.goal_progress for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin()
    or (
      auth.uid() = user_id
      and public.user_owns_goal(goal_id)
    )
  );

create policy "goal_progress_delete"
  on public.goal_progress for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ─── meal_entries (food_entries) ─────────────────────────
create policy "meal_entries_select"
  on public.meal_entries for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "meal_entries_insert"
  on public.meal_entries for insert to authenticated
  with check (auth.uid() = user_id or public.is_admin());

create policy "meal_entries_update"
  on public.meal_entries for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "meal_entries_delete"
  on public.meal_entries for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ─── nutrition_goals ─────────────────────────────────────
create policy "nutrition_goals_select"
  on public.nutrition_goals for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "nutrition_goals_insert"
  on public.nutrition_goals for insert to authenticated
  with check (auth.uid() = user_id or public.is_admin());

create policy "nutrition_goals_update"
  on public.nutrition_goals for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "nutrition_goals_delete"
  on public.nutrition_goals for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

notify pgrst, 'reload schema';
