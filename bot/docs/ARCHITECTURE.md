# Архитектура Telegram-бота Tracker

## Компоненты

```mermaid
flowchart LR
  TG[Telegram API] -->|HTTPS webhook| WH[bot-webhook :3001]
  WH -->|service_role| SB[(Supabase)]
  WK[bot-worker :3002] -->|BullMQ tick 60s| RD[(Redis)]
  WK -->|sendMessage| TG
  WK --> SB
  FE[Next.js frontend] -->|RLS| SB
  FE -->|link token| SB
  WH --> SB
```

| Процесс | Entry-point | Назначение |
|---|---|---|
| **bot-webhook** | `start-webhook.ts` | Приём updates, команды, callbacks |
| **bot-worker** | `start-worker.ts` | Cron напоминания + дайджесты |
| **redis** | — | Очередь BullMQ |
| **frontend** | Next.js | UI, API routes, deep-link токены |

---

## 1. Связка аккаунта (deep-link)

```mermaid
sequenceDiagram
  actor U as Пользователь
  participant FE as Frontend
  participant SB as Supabase
  participant TG as Telegram
  participant WH as bot-webhook

  U->>FE: Настройки → Сгенерировать ссылку
  FE->>SB: INSERT telegram_link_tokens
  FE-->>U: t.me/Bot?start=TOKEN
  U->>TG: /start TOKEN
  TG->>WH: webhook Update
  WH->>SB: validate token, INSERT telegram_users
  SB-->>WH: OK
  WH-->>TG: «Аккаунт связан»
  Note over SB: trigger sync_profile_telegram
```

---

## 2. Пользовательское напоминание (reminder_schedules)

```mermaid
sequenceDiagram
  participant WK as bot-worker
  participant RD as Redis/BullMQ
  participant SB as Supabase
  participant TG as Telegram

  loop каждые 60 сек
    RD->>WK: scheduler-tick job
    WK->>SB: SELECT due reminder_schedules
    alt enabled + prefs allow kind
      WK->>TG: sendMessage
      WK->>SB: INSERT notification_logs (sent)
      WK->>SB: UPDATE next_run_at
    else skipped
      WK->>SB: INSERT notification_logs (skipped_*)
    end
  end
```

---

## 3. Ежедневная сводка (daily_summary)

```mermaid
sequenceDiagram
  participant WK as bot-worker
  participant SB as Supabase
  participant TG as Telegram

  WK->>SB: listActive telegram_users
  WK->>SB: notification_preferences
  alt past scheduled time + not sent for slot
    WK->>SB: habits, goals, nutrition
    WK->>TG: 📊 Сводка за …
    WK->>SB: notification_logs daily_summary sent
  end
```

Идемпотентность: повтор не отправляется, если `sent` уже есть **после** сегодняшнего `daily_summary_time` (не с полуночи).

---

## 4. Webhook-запрос (production)

```mermaid
sequenceDiagram
  participant TG as Telegram
  participant WH as Fastify :3001
  participant G as grammY Bot

  TG->>WH: POST /tg/webhook/{pathSecret}
  Note over TG,WH: Header X-Telegram-Bot-Api-Secret-Token
  alt secret mismatch
    WH-->>TG: 401
  else OK
    WH->>G: handleUpdate
    G->>G: middleware → handler
    WH-->>TG: 200
  end
```

Трёхуровневая защита:
1. HTTPS (Telegram requirement)
2. Случайный `pathSecret` в URL
3. `headerSecret` в `X-Telegram-Bot-Api-Secret-Token`

---

## Observability

| Endpoint | Процесс | Описание |
|---|---|---|
| `GET /healthz` | webhook :3001, worker :3002 | Supabase + Redis checks |
| `GET /metrics` | webhook :3001, worker :3002 | Prometheus text counters |

Метрики: `tracker_http_requests_total`, `tracker_webhook_updates_total`, `tracker_reminders_sent_total`, `tracker_digests_sent_total`, `tracker_worker_jobs_total`.
