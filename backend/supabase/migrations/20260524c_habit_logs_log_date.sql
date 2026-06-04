-- 20260524c_habit_logs_log_date.sql
-- Миграция legacy habit_logs (id, task_id, completed_at) → (habit_id, log_date, completed).
-- Причина: код бота и фронта ожидает log_date/completed; старая таблица создана до schema.sql.
-- Безопасно повторно. Запуск: Supabase Dashboard → SQL Editor → Run.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'completed_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'log_date'
  ) then
    raise notice 'Migrating legacy habit_logs to log_date schema...';

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

    drop policy if exists "habit_logs own" on public.habit_logs;
    drop policy if exists "habit_logs_select_own" on public.habit_logs;
    drop policy if exists "habit_logs_insert_own" on public.habit_logs;
    drop policy if exists "habit_logs_update_own" on public.habit_logs;
    drop policy if exists "habit_logs_delete_own" on public.habit_logs;
    drop policy if exists "habit_logs_select" on public.habit_logs;
    drop policy if exists "habit_logs_insert" on public.habit_logs;
    drop policy if exists "habit_logs_update" on public.habit_logs;
    drop policy if exists "habit_logs_delete" on public.habit_logs;

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

    create index if not exists habit_logs_user_id_idx on public.habit_logs (user_id);

    raise notice 'habit_logs migration complete.';
  else
    raise notice 'habit_logs already uses log_date schema — skipped.';
  end if;
end $$;

notify pgrst, 'reload schema';
