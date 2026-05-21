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

Один репозиторий — коммит **только из корня** `Tracker` (не из подпапки без Git).

### Cursor / VS Code

1. **File → Open Folder** → выберите `C:\Users\Дмитрий\Tracker` (корень, где лежат `frontend/` и `backend/`).
2. Сохраните файлы (`Ctrl+S`).
3. Боковая панель **Source Control** (иконка ветки) или `Ctrl+Shift+G`.
4. Если видите изменения — кнопка **+** у «Changes» (Stage All) или галочка у каждого файла.
5. Введите сообщение коммита сверху → **Commit** (галочка).

Если кнопка Commit неактивна: пустое сообщение, нет сохранённых изменений или открыта не та папка.

В `.vscode/settings.json` включён **Smart Commit**: при коммите без stage подхватываются все изменения, включая новые файлы.

### Терминал

```bash
git add -A
git status
git commit -m "описание"
git push
```

### «Nothing to commit»

- Нет несохранённых правок, или
- Правки только в игнорируемых файлах (`.env.local`, `frontend/node_modules`, `frontend/.next`).

### Не попадут в коммит (это нормально)

- `frontend/.env.local`, `frontend/node_modules/`, `frontend/.next/`
- `**/*.local.sql`
