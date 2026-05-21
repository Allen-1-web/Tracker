This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase

1. Создайте проект на [Supabase](https://supabase.com) и откройте **Settings → API**: скопируйте **Project URL** и **anon public** ключ.
2. В корне приложения создайте файл `.env.local` (см. `.env.example`):

   ```env
   SUPABASE_URL=https://ВАШ_ПРОЕКТ.supabase.co
   SUPABASE_ANON_KEY=ваш_anon_ключ
   ```

   Укажите **только Project URL** (`https://….supabase.co`), **без** `/rest/v1` и без лишнего слеша в конце — иначе авторизация вернёт ошибку вроде *Invalid path specified in request URL*.

3. В SQL Editor выполните скрипт из `../backend/supabase/schema.sql` (таблицы, RLS, триггер для профиля и категорий, справочник продуктов). Если база уже была создана раньше — `../backend/supabase/apply_fix.sql`, затем миграции по порядку:
   - `../backend/supabase/migrations/20260521_rls_auth_policies.sql`
   - `../backend/supabase/migrations/20260522_validation_constraints.sql`
   - **`../backend/supabase/migrations/20260523_roles_rls_security.sql`** (роли admin/user, admin RLS, ownership checks, audit log)
4. Первого администратора назначьте вручную (один раз, SQL Editor): скопируйте `../backend/supabase/scripts/bootstrap-admin.sql.example` → `bootstrap-admin.local.sql`, замените `YOUR_ADMIN_EMAIL`, выполните. Локальные `*.local.sql` не коммитятся.
5. Для локальной разработки в **Authentication → Providers** включите **Email**; при необходимости отключите подтверждение email, чтобы сразу получать сессию после регистрации.

**Авторизация:** регистрация и вход через Supabase Auth (`signUp` / `signInWithPassword` / `signOut` в `lib/store.ts`, формы `/login` и `/register`). Сессия хранится в cookies (`@supabase/ssr`). Защита маршрутов: `middleware.ts` + `app/(app)/layout.tsx` + `/admin` (только `profiles.role = 'admin'`). Доступ к данным: RLS в Postgres (свои строки для `user`, все строки для `admin`). Централизованные проверки: `lib/auth/*`, хуки `useRole` / `useAdmin`.

## Установка и запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Команды: `npm run build`, `npm run typecheck`, `npm run lint`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
