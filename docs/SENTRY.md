# Sentry — мониторинг ошибок

Проект Tracker: **Next.js (React)** + **Node.js бот** (Fastify + grammY).  
DSN хранится в `.env`, в git не коммитится.

---

## Шаг 1. Регистрация в Sentry

1. Откройте [sentry.io](https://sentry.io) → **Sign up** (GitHub/Google или email).
2. Создайте **Organization** (например `tracker`).
3. Создайте **два проекта** (удобнее разделять ошибки):
   - Platform: **Next.js** → имя `tracker-frontend`
   - Platform: **Node.js** → имя `tracker-bot`

---

## Шаг 2. Скопируйте DSN

В каждом проекте: **Settings → Client Keys (DSN)**.

Формат:

```
https://<key>@o<org-id>.ingest.sentry.io/<project-id>
```

---

## Шаг 3. Локальная разработка

### Frontend (`frontend/.env.local`)

```env
SENTRY_DSN=https://...@....ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...
SENTRY_ENVIRONMENT=development
```

`NEXT_PUBLIC_SENTRY_DSN` нужен для ошибок в браузере. Можно указать тот же DSN, что и `SENTRY_DSN`.

### Bot (`bot/.env`)

```env
SENTRY_DSN=https://...@....ingest.sentry.io/...
SENTRY_ENVIRONMENT=development
```

Перезапустите dev-серверы после изменения `.env`.

---

## Шаг 4. Production (VPS / Docker)

### Frontend

В `frontend/.env.production`:

```env
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Важно:** `NEXT_PUBLIC_SENTRY_DSN` попадает в клиентский JS **на этапе сборки**.  
Добавьте DSN в корневой `.env` (для `docker compose build`) или в build-args:

```env
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

Пересборка:

```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### Bot

В `bot/.env` на сервере:

```env
SENTRY_DSN=...
SENTRY_ENVIRONMENT=production
```

Перезапуск:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate bot-webhook bot-worker
```

---

## Шаг 5. Source maps (опционально)

Чтобы в Sentry были читаемые stack trace для фронтенда:

1. Sentry → **Settings → Auth Tokens** → Create token (scope: `project:releases`, `org:read`).
2. В CI или локально перед `npm run build`:

```env
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=tracker-frontend
SENTRY_AUTH_TOKEN=sntrys_...
```

Source maps загружаются автоматически через `withSentryConfig` в `frontend/next.config.ts`.

---

## Шаг 6. Проверка

### Frontend (браузер)

1. Запустите `npm run dev` в `frontend`.
2. В DevTools Console:

```javascript
throw new Error('Sentry frontend test')
```

3. Sentry → **Issues** → проект `tracker-frontend` — должна появиться ошибка за ~30 сек.

### Frontend (сервер / API)

Временно добавьте в любой API route:

```typescript
throw new Error('Sentry server test')
```

### Bot

На VPS с `SENTRY_DSN` в `bot/.env` — вызовите необработанную ошибку (не бизнес-ошибки вроде «неверная ссылка» — они намеренно не отправляются).

---

## Что уже настроено в коде

| Компонент | Файлы |
|-----------|--------|
| Next.js client | `frontend/instrumentation-client.ts` |
| Next.js server | `frontend/sentry.server.config.ts`, `frontend/instrumentation.ts` |
| Next.js edge | `frontend/sentry.edge.config.ts` |
| React global errors | `frontend/app/global-error.tsx` |
| Build / tunnel | `frontend/next.config.ts` (`/sentry-tunnel`) |
| Bot webhook/worker | `bot/src/instrumentation/sentry.ts` |
| Bot grammY errors | `bot/src/presentation/middleware/error.ts` |
| Bot webhook HTTP | `bot/src/infrastructure/http/server.ts` |

---

## Переменные окружения

| Переменная | Где | Назначение |
|------------|-----|------------|
| `SENTRY_DSN` | frontend, bot | Основной DSN (server-side) |
| `NEXT_PUBLIC_SENTRY_DSN` | frontend | DSN для браузера |
| `SENTRY_ENVIRONMENT` | оба | `development` / `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | оба | Доля трассировок (0.1 = 10%) |
| `SENTRY_DEBUG` | frontend | `true` — логи SDK в консоль |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | frontend build | Загрузка source maps |

Если `SENTRY_DSN` пуст — Sentry **отключён**, приложение работает как раньше.

---

## Troubleshooting

| Симптом | Решение |
|---------|---------|
| Ошибки фронта не видны в Sentry | Проверьте `NEXT_PUBLIC_SENTRY_DSN` **до** `npm run build` / Docker build |
| Ошибки бота не видны | `SENTRY_DSN` в `bot/.env`, перезапуск контейнеров |
| Ad-blocker блокирует Sentry | Используется tunnel `/sentry-tunnel` в Next.js |
| Шум от «неверная ссылка» | Ожидаемо: бизнес-ошибки `BotError` не отправляются |
