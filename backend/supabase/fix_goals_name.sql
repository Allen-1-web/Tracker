-- goals: колонки title (старая схема) + name (приложение Tracker)
-- Supabase → SQL Editor → вставить ВЕСЬ файл → Run → подождите 2 мин → Ctrl+F5

alter table public.goals add column if not exists name text;
alter table public.goals add column if not exists title text;
alter table public.goals add column if not exists description text;
alter table public.goals add column if not exists type text default 'numeric';
alter table public.goals add column if not exists target_value numeric default 1;
alter table public.goals add column if not exists current_value numeric default 0;
alter table public.goals add column if not exists unit text;
alter table public.goals add column if not exists deadline date default current_date;
alter table public.goals add column if not exists category_id uuid references public.categories (id) on delete set null;
alter table public.goals add column if not exists linked_habit_ids uuid[] default '{}';
alter table public.goals add column if not exists created_at timestamptz default now();

update public.goals set name = title where (name is null or name = '') and title is not null;
update public.goals set title = name where (title is null or title = '') and name is not null;
update public.goals set name = coalesce(name, title, 'Цель'), title = coalesce(title, name, 'Цель');

update public.goals set type = 'numeric' where type is null;
update public.goals set target_value = 1 where target_value is null;
update public.goals set current_value = 0 where current_value is null;
update public.goals set deadline = current_date where deadline is null;
update public.goals set linked_habit_ids = '{}' where linked_habit_ids is null;

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
  for each row
  execute function public.goals_sync_name_title();

notify pgrst, 'reload schema';
