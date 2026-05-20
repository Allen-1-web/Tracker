-- Миграция: habits.category / goals.category (text) → category_id (FK)
-- Запустите в Supabase SQL Editor, если проект уже развёрнут со старой схемой.

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
