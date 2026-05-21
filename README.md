# Tracker

Монорепозиторий: приложение и схема БД в одном Git-репозитории.

| Папка | Назначение |
|-------|------------|
| `frontend/` | Next.js приложение (`npm run dev` из этой папки) |
| `backend/supabase/` | SQL: `schema.sql`, миграции, скрипты bootstrap admin |
| `vite-legacy/` | Старая Vite-версия (опционально) |

## Быстрый старт

```bash
cd frontend
cp .env.example .env.local   # заполните SUPABASE_URL и SUPABASE_ANON_KEY
npm install
npm run dev
```

Схема Supabase: см. `frontend/README.md` (пути к SQL — `../backend/supabase/`).

## Git

Один репозиторий — коммит из корня:

```bash
git add -A
git status
git commit -m "описание"
git push
```
