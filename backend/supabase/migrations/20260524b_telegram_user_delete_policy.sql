-- 20260524b_telegram_user_delete_policy.sql
-- Stage 2: пользователь должен иметь возможность отвязать Telegram через UI / API.
-- Добавляем DELETE policy на свою строку в telegram_users.
-- Триггер telegram_users_sync_profile автоматически сбросит profiles.telegram_connected.
--
-- Запуск: Supabase Dashboard → SQL Editor → New query → Run.

drop policy if exists "telegram_users_delete_own" on public.telegram_users;
create policy "telegram_users_delete_own" on public.telegram_users
  for delete to authenticated using (auth.uid() = user_id);
