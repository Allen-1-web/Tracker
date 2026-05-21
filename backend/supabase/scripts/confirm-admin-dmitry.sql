-- Подтверждение email и роль admin для dmitry.yarosch@mail.ru
-- Запуск: Supabase Dashboard → SQL → New query → Run
-- (пользователь уже создан через регистрацию; id ниже)

-- 1) Подтвердить почту в Auth
update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now()),
  updated_at = now()
where email = 'dmitry.yarosch@mail.ru';

-- 2) Роль admin (если ошибка "cannot change role" — сначала блок ниже с DISABLE TRIGGER)
-- alter table public.profiles disable trigger profiles_role_guard;
update public.profiles
set role = 'admin', updated_at = now()
where email = 'dmitry.yarosch@mail.ru';
-- alter table public.profiles enable trigger profiles_role_guard;

-- Проверка
select u.id, u.email, u.email_confirmed_at, p.role, p.name
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'dmitry.yarosch@mail.ru';
