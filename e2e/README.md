## Playwright E2E (production-like)

E2E тесты живут в `e2e/` и запускаются против **реального** Next.js приложения и **реального** Supabase Auth/DB (RLS включён).

### Зависимости

Из корня репозитория:

```bash
npm install
npm run e2e:install
```

### Env strategy

1) Скопируйте `e2e/.env.e2e.example` → `e2e/.env.e2e` и заполните.

Требуется **отдельный Supabase test project**, где:
- email confirmation отключён (или вы готовы обрабатывать подтверждение);
- включён RLS (как в проде);
- есть сиды `food_items` (иначе nutrition flow будет пустым).

Переменные:
- `E2E_BASE_URL` — куда ходит Playwright.
- `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY` — используются **только** для cleanup после теста.
  - также используются для **auto-confirm** email, если confirmation включён в Supabase.

### Что покрывает `user-journey.e2e.spec.ts`

- Регистрация → онбординг → dashboard
- Привычка (частота «по дням»), отметка, streak
- Цель с привязкой к привычке + прогресс на странице цели
- Питание (quick log)
- `/reminders` и настройки уведомлений (daily summary, расписание)
- Виджеты «Прогресс дня» на dashboard
- Logout/login и проверка сохранённых данных

Опционально (если Telegram подключён): timezone и quiet hours в настройках.

### Запуск локально

```bash
npm run e2e
```

По умолчанию Playwright:
1. читает `e2e/.env.e2e` (порт **3099**, чтобы не конфликтовать с `dev` на 3000/3010);
2. делает production `build` + `next start` через `e2e/scripts/start-web.mjs`;
3. гоняет `user-journey.e2e.spec.ts`.

Повторный build можно пропустить (если код не менялся):

```bash
E2E_SKIP_CLEAN_BUILD=1 npm run e2e
```

Если сервер уже поднят вручную:

```bash
E2E_NO_WEB_SERVER=1 npm run e2e
```

Если нужно переиспользовать уже запущенный сервер на `E2E_BASE_URL`:

```bash
E2E_REUSE_SERVER=1 npm run e2e
```

### Storage state (ускорение auth)

Если вы хотите ускорить набор тестов (кроме тестов регистрации), можно включить storageState:

1) Создайте пользователя в test Supabase проекте (или используйте существующего).
2) В `e2e/.env.e2e` задайте:
   - `E2E_EXISTING_USER_EMAIL`
   - `E2E_EXISTING_USER_PASSWORD`
3) Запускайте так:

```bash
E2E_USE_STORAGE_STATE=1 npm run e2e
```

Это выполнит `e2e/tests/auth.setup.ts`, сохранит cookies/storage в `e2e/.auth/storageState.json` и переиспользует его в проектах.

### Запуск против docker compose

Если вы поднимаете stack через `docker compose` (Redis/бот и т.п.), это не обязательно для веб E2E.
Главное — чтобы веб был доступен по `E2E_BASE_URL`, а Supabase test project был настроен.

### Артефакты

- HTML report: `e2e/playwright-report/`
- Traces/screenshots/videos: `e2e/test-results/`

