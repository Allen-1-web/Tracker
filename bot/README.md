# @tracker/bot

Telegram companion для Tracker — быстрые отметки привычек, напоминания и сводки. Не дублирует весь веб; см. [`docs/PRODUCT.md`](../docs/PRODUCT.md).

Отдельный Node.js пакет внутри монорепозитория. Делится с frontend только через Supabase БД и тонкий API. **Не импортируется** во frontend (бот = серверный процесс).

## Стек

- **grammY** 1.x — Telegram Bot SDK (TypeScript-first, активный мейнтенанс)
- **BullMQ** 5 + **Redis** — очередь и cron-шедулер (repeatable jobs, delayed, retry с backoff)
- **Fastify** 5 — HTTP-сервер для webhook + `/healthz`
- **pino** — структурный JSON-логгер
- **luxon** + **cron-parser** — TZ и cron
- **Zod** — валидация env и DTO
- **Supabase JS** — клиент с `service_role`

## Архитектура (clean)

```
src/
├── domain/              типы и правила без IO
├── application/         use cases (services)
├── infrastructure/      adapters: supabase, queue, telegram, logger, config
├── presentation/        bot UX: commands / conversations / callbacks / middleware
├── shared/              utils (time, validation)
└── app/                 composition root + entrypoints
    ├── start-bot.ts        long-polling (dev/prod fallback)
    ├── start-webhook.ts    HTTP webhook (production, Stage 7)
    └── start-worker.ts     BullMQ worker (Stage 4)
```

## Быстрый старт (Stage 1)

### 1. Установка зависимостей

Из корня репозитория (используются npm workspaces):

```bash
npm install
```

Или только bot:

```bash
npm install --workspace bot
```

### 2. Создание Telegram бота

1. Открой [@BotFather](https://t.me/BotFather) в Telegram.
2. `/newbot` → введи имя и username (например `tracker_dev_bot`).
3. Скопируй токен — это `TELEGRAM_BOT_TOKEN`.
4. Опционально: `/setcommands`:
   ```
   start - Главное меню
   help - Справка
   settings - Настройки
   goals - Цели
   habits - Привычки
   nutrition - Питание
   reminders - Напоминания
   report - Отчёт
   ```

### 3. Применение миграции БД

Supabase Dashboard → SQL Editor → New query → вставить
`backend/supabase/migrations/20260524_telegram_integration.sql` → Run.

### 4. Конфигурация

```bash
cd bot
cp .env.example .env
```

Заполни:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME` (без `@`)
- `SUPABASE_URL` (тот же, что во frontend)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API → service_role)
- `REDIS_URL` (для Stage 1 необязателен; нужен начиная со Stage 4)

### 5. Запуск

```bash
npm run dev:bot          # с авто-перезагрузкой
# или из bot/
npm run dev
```

Должно появиться:

```
[12:00:00.123] INFO: supabase: connection OK
[12:00:00.456] INFO: bot: initialized (bot=tracker_dev_bot, mode=polling)
[12:00:00.789] INFO: bot: polling started
```

### 6. Worker напоминаний (Stage 4)

Убедитесь, что Redis запущен (`REDIS_URL` в `.env`, см. Docker/Memurai).

В **отдельном терминале**:

```bash
npm run dev:worker
```

Должно появиться `worker: reminder scheduler started`. Worker каждую минуту проверяет due-напоминания и шлёт их в Telegram.

### 7. Проверка

В Telegram открой своего бота и отправь:

- `/ping` → бот ответит `pong 🏓`
- `/id` → бот покажет твой `chat_id` и `user_id`
- `/start` / `/help` → приветствие и справка
- `/reminders` → список напоминаний (нужен worker для отправки)

## Скрипты

| Скрипт | Что делает |
|---|---|
| `npm run dev` | Bot в watch-режиме (`tsx watch`) |
| `npm run dev:worker` | BullMQ worker (Stage 4) |
| `npm run dev:webhook` | Webhook-сервер (Stage 7) |
| `npm run build` | TypeScript → `dist/` |
| `npm start` | Production polling |
| `npm run start:worker` | Production worker |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest |

## Безопасность

- `SUPABASE_SERVICE_ROLE_KEY` обходит RLS — **никогда** не клиенту, **никогда** в репозитории.
- Webhook-режим использует трёхуровневую защиту: непредсказуемый path-secret в URL, header secret и HTTPS — см. Stage 7.
- Все callback_data валидируются Zod-схемами, размер ≤ 64 байт (лимит Telegram).
- Per-chat rate limit через `@grammyjs/ratelimiter` + Redis bucket (Stage 3).
- Все исходящие SQL-запросы из bot-сервиса обязаны явно фильтровать по `user_id` (поскольку RLS обходится).

## Этапы реализации

| # | Stage | Статус |
|---|---|---|
| 1 | Фундамент (этот README, конфиг, миграция, минимальный бот) | ✅ |
| 2 | Связка аккаунта (deep-link флоу) | ✅ |
| 3 | Команды + клавиатуры (главное меню, /habits, /goals, /nutrition, чекины) | ✅ |
| 4 | Напоминания + BullMQ шедулер | ✅ |
| 5 | Уведомления и отчёты (digest, hydration, missed habits) | ✅ |
| 6 | Frontend API + UI (reminders, preferences) | ✅ |
| 7 | Production hardening: Docker, webhook, метрики, sequence diagrams | ✅ |

---

## Stage 7 — Production

### Webhook (вместо polling)

1. Сгенерируйте секреты (≥ 16 символов):
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
2. В `bot/.env`:
   ```env
   TELEGRAM_MODE=webhook
   TELEGRAM_WEBHOOK_BASE_URL=https://your-domain.example
   TELEGRAM_WEBHOOK_PATH_SECRET=<random>
   TELEGRAM_WEBHOOK_HEADER_SECRET=<random>
   HTTP_PORT=3001
   ```
3. Запуск локально (нужен HTTPS-туннель, напр. ngrok):
   ```bash
   ngrok http 3001
   # TELEGRAM_WEBHOOK_BASE_URL=https://xxxx.ngrok-free.app
   npm run dev:webhook
   ```

Бот сам вызовет `setWebhook` при старте. Endpoint: `POST /tg/webhook/<pathSecret>`.

### Docker Compose

Из корня репозитория (заполните `bot/.env`):

```bash
npm run docker:up
# webhook → http://localhost:3001/healthz
# worker  → http://localhost:3002/healthz
# metrics → /metrics на обоих портах
```

Сервисы: `redis`, `bot-webhook`, `bot-worker`. См. [`docker-compose.yml`](../docker-compose.yml).

### Observability

| URL | Процесс |
|---|---|
| `GET /healthz` | JSON: supabase + redis, `200` или `503` |
| `GET /metrics` | Prometheus text format |

### Sequence diagrams

См. [`bot/docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — связка аккаунта, напоминания, дайджесты, webhook.

### Dev vs Prod

| | Dev | Prod |
|---|---|---|
| Bot mode | `polling` (`npm run dev:bot`) | `webhook` (Docker / `start:webhook`) |
| Worker | `npm run dev:worker` | `bot-worker` container |
| Redis | Docker `tracker-redis` | `docker-compose` redis |

### Stage 6 — Frontend (настройки уведомлений)

На странице **Настройки** (`/settings`):

- **Уведомления Telegram** — `notification_preferences` (сводки, гидратация, типы напоминаний)
- **Расписание напоминаний** — CRUD `reminder_schedules`
- **Часовой пояс и тихие часы** — в карточке Telegram (после привязки)

API routes (Next.js, сессия Supabase):

| Метод | Путь | Описание |
|---|---|---|
| GET/PATCH | `/api/notifications/preferences` | Настройки digest/уведомлений |
| GET/POST | `/api/reminders` | Список / создание напоминания |
| PATCH/DELETE | `/api/reminders/[id]` | Вкл/выкл, удаление |
| GET/PATCH | `/api/telegram/preferences` | TZ и quiet hours |
