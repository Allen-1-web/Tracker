# Supabase setup scripts

## В репозитории

- `bootstrap-admin.sql.example` — шаблон назначения первого admin (плейсхолдер `YOUR_ADMIN_EMAIL`).

## Локально (не коммитить)

Скопируйте шаблон и подставьте свой email:

```bash
cp bootstrap-admin.sql.example bootstrap-admin.local.sql
```

Отредактируйте `bootstrap-admin.local.sql`, затем выполните в Supabase SQL Editor.

Файлы `*.local.sql` и `confirm-admin-*.sql` игнорируются git (см. `.gitignore` в этой папке).
