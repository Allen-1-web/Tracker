# Production deployment (Timeweb Cloud VPS)

Монорепозиторий Tracker: **Next.js** (UI + `/api/*`) + **grammY/Fastify** (Telegram webhook) + **BullMQ worker** + **Redis** + **Supabase** (внешний).

Замените `app.example.ru`, `YOUR_IP`, `YOUR_USER/Tracker` на свои значения.

## Архитектура

```
Internet → Nginx (:443)
            ├─ /       → frontend (Next.js :3000), включая /api/*
            └─ /tg/*   → bot-webhook (Fastify :3001)
bot-worker (:3002, internal) → Redis → BullMQ
frontend / bot → Supabase (HTTPS)
```

Отдельного Fastify REST API для фронта нет — все HTTP API живут в Next.js Route Handlers.

## Файлы деплоя

| Файл | Назначение |
|------|------------|
| [`frontend/Dockerfile`](frontend/Dockerfile) | Next.js standalone образ |
| [`bot/Dockerfile`](bot/Dockerfile) | webhook + worker targets |
| [`docker-compose.prod.yml`](docker-compose.prod.yml) | nginx, frontend, bot, redis |
| [`deploy/nginx/conf.d/tracker.conf`](deploy/nginx/conf.d/tracker.conf) | HTTP bootstrap (до SSL) |
| [`deploy/nginx/conf.d/tracker.ssl.conf.example`](deploy/nginx/conf.d/tracker.ssl.conf.example) | HTTPS после Let's Encrypt |
| [`deploy/nginx/tracker.conf`](deploy/nginx/tracker.conf) | указатель на конфиги |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | CI deploy по push в `main` |

## Переменные окружения

### `frontend/.env.production` (не коммитить)

```env
NODE_ENV=production
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
TELEGRAM_BOT_USERNAME=my_tracker_bot
REDIS_URL=redis://redis:6379
```

### `bot/.env` (не коммитить)

```env
NODE_ENV=production
LOG_LEVEL=info
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_BOT_USERNAME=my_tracker_bot
TELEGRAM_MODE=webhook
TELEGRAM_WEBHOOK_BASE_URL=https://app.example.ru
TELEGRAM_WEBHOOK_PATH_SECRET=<openssl rand -hex 24>
TELEGRAM_WEBHOOK_HEADER_SECRET=<openssl rand -hex 24>
HTTP_PORT=3001
HTTP_HOST=0.0.0.0
WORKER_HTTP_PORT=3002
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REDIS_URL=redis://redis:6379
BULLMQ_PREFIX=tracker
DEFAULT_TIMEZONE=Europe/Moscow
DEFAULT_LOCALE=ru
```

### Корневой `.env` (для `docker compose build`)

Скопируйте [`deploy/compose.env.example`](deploy/compose.env.example) → `.env` в корне репозитория (нужны `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TELEGRAM_BOT_USERNAME` на этапе сборки frontend).

### Supabase Dashboard

- **Authentication → URL configuration**
  - Site URL: `https://app.example.ru`
  - Redirect URLs: `https://app.example.ru/**`

---

## Timeweb Cloud — пошагово

### 1. Регистрация

[timeweb.cloud](https://timeweb.cloud) → аккаунт, подтверждение email.

### 2. VPS

**Облачные серверы → Создать**: Ubuntu **24.04 LTS**, 2 vCPU / 2 GB RAM / 30 GB SSD (MVP), SSH-ключ.

### 3. SSH

```powershell
ssh -i $env:USERPROFILE\.ssh\id_ed25519 root@YOUR_IP
```

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
```

Дальше: `ssh deploy@YOUR_IP`.

### 4. Домен

DNS: `A` `@` и при необходимости `www` → `YOUR_IP`.

```bash
dig +short app.example.ru
```

### 5–6. Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
newgrp docker
```

### 7. Клонирование

```bash
sudo mkdir -p /opt/tracker && sudo chown deploy:deploy /opt/tracker
cd /opt/tracker
git clone https://github.com/YOUR_USER/Tracker.git .
git checkout main
```

### 8. Конфигурация

```bash
cp frontend/.env.production.example frontend/.env.production
cp bot/.env.example bot/.env
cp deploy/compose.env.example .env
nano frontend/.env.production
nano bot/.env
nano .env
nano deploy/nginx/conf.d/tracker.conf   # заменить app.example.ru на ваш домен
```

В `bot/.env` для HTTP-этапа: `TELEGRAM_WEBHOOK_BASE_URL=http://app.example.ru` (после SSL — `https://...`).

Сгенерировать секреты webhook:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### 9. Запуск (HTTP bootstrap)

По умолчанию активен [`deploy/nginx/conf.d/tracker.conf`](deploy/nginx/conf.d/tracker.conf) — только порт 80, nginx стартует **без** сертификатов.

```bash
cd /opt/tracker
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Проверка: `http://app.example.ru` (пока без TLS).

### 10. TLS (Let's Encrypt)

```bash
sudo apt install -y certbot
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Вариант A — webroot** (nginx уже слушает :80):

```bash
sudo certbot certonly --webroot -w /opt/tracker/deploy/certbot/www -d app.example.ru \
  --agree-tos -m you@example.ru --non-interactive
```

**Вариант B — standalone** (остановите nginx: `docker compose -f docker-compose.prod.yml stop nginx`):

```bash
sudo certbot certonly --standalone -d app.example.ru --agree-tos -m you@example.ru --non-interactive
```

Включите HTTPS:

```bash
cp deploy/nginx/conf.d/tracker.ssl.conf.example deploy/nginx/conf.d/tracker.ssl.conf
rm deploy/nginx/conf.d/tracker.conf
# bot/.env: TELEGRAM_WEBHOOK_BASE_URL=https://app.example.ru
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

Автообновление:

```bash
echo "0 3 * * * root certbot renew --quiet && docker compose -f /opt/tracker/docker-compose.prod.yml exec nginx nginx -s reload" | sudo tee /etc/cron.d/certbot-tracker
```

Или из корня репозитория локально: `npm run docker:prod:up`.

---

## CI/CD (GitHub Actions)

Секреты репозитория:

| Secret | Пример |
|--------|--------|
| `DEPLOY_HOST` | IP или домен VPS |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | приватный SSH-ключ |
| `DEPLOY_PATH` | `/opt/tracker` (опционально) |

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — push в `main` → SSH → `git pull` → `docker compose build` → `up -d`.

Файлы `.env` на сервере **не** перезаписываются из CI.

---

## Чек-лист после деплоя

- [ ] `https://app.example.ru` — UI, логин/регистрация
- [ ] `https://app.example.ru/api/telegram/status` — 401 без сессии
- [ ] Supabase: данные загружаются после входа
- [ ] `docker compose -f docker-compose.prod.yml logs bot-webhook` — `webhook: registered with Telegram`, `lastError: null`
- [ ] `/start` в Telegram — бот отвечает
- [ ] `docker exec tracker-redis redis-cli ping` → `PONG`
- [ ] `docker compose -f docker-compose.prod.yml logs bot-worker` — без ошибок старта
- [ ] `curl -I https://app.example.ru` — валидный TLS
- [ ] Порты 6379, 3001, 3002 **не** открыты с интернета (только 80/443)

Проверка health из сети compose:

```bash
docker compose -f docker-compose.prod.yml exec bot-webhook node -e "fetch('http://127.0.0.1:3001/healthz').then(r=>r.json()).then(console.log)"
```

---

## Рекомендуемые ресурсы VPS

| Нагрузка | vCPU | RAM | SSD |
|----------|------|-----|-----|
| MVP | 2 | 2 GB | 30 GB |
| ~100 пользователей | 2–4 | 4 GB | 40 GB |
| ~1000 пользователей | 4–8 | 8 GB | 60–80 GB |

---

## Локальная разработка (без prod compose)

```bash
npm run dev              # Next.js :3000
npm run dev:webhook      # bot webhook :3001
npm run dev:worker       # worker :3002
npm run docker:up        # только redis + bot (dev compose)
```

См. также [`bot/README.md`](bot/README.md) и [`frontend/README.md`](frontend/README.md).
