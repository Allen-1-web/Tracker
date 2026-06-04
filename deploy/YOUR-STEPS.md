# Что нужно сделать вам (ptnway.ru)

Автоматически уже сделано: конфиги nginx → `ptnway.ru`, локальные env, push в GitHub (см. ниже).

---

## Шаг 1. BotFather (~2 мин) — обязательно

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте `/revoke` для бота **@Track_Luffy_bot**.
3. Скопируйте **новый токен**.
4. Вставьте в файл `deploy/local/bot.env.production` строку `TELEGRAM_BOT_TOKEN=...`
5. На сервере (после шага 4) тот же токен должен быть в `/opt/tracker/bot/.env`.

---

## Шаг 2. DNS в Timeweb (~5 мин)

1. [timeweb.cloud](https://timeweb.cloud) → **Домены** → **ptnway.ru** → **DNS**.
2. Записи:
   - **A** `@` → `176.124.210.254`
   - **A** `www` → `176.124.210.254`
3. Проверка в PowerShell:

```powershell
nslookup ptnway.ru
```

Должен быть адрес **176.124.210.254**.

---

## Шаг 3. Supabase (~5 мин)

1. [supabase.com/dashboard](https://supabase.com/dashboard) → проект **uogcqfnlfrdpccxpxidh**.
2. **Authentication** → **URL configuration**:
   - **Site URL:** `https://ptnway.ru`
   - **Redirect URLs:** добавить `https://ptnway.ru/**`
3. Сохранить.
4. **SQL Editor** → New query → вставьте и выполните **Run** (по порядку):
   - `backend/supabase/migrations/20260524_telegram_integration.sql`
   - `backend/supabase/migrations/20260524b_telegram_user_delete_policy.sql`
   - `backend/supabase/migrations/20260524c_habit_logs_log_date.sql`  
   Без этого бот падает с ошибками таблиц `telegram_users` / `telegram_link_tokens`.

---

## Шаг 4. VPS — первый вход и деплой (~15–30 мин)

### 4.1 SSH

```powershell
ssh root@176.124.210.254
```

(Или `ssh deploy@176.124.210.254`, если пользователь `deploy` уже создан.)

### 4.2 Установка Docker (если ещё нет)

На сервере как root:

```bash
curl -fsSL https://raw.githubusercontent.com/Allen-1-web/Tracker/main/deploy/scripts/vps-bootstrap.sh -o /tmp/vps-bootstrap.sh
bash /tmp/vps-bootstrap.sh
```

Либо скопируйте с ПК: `scp deploy/scripts/vps-bootstrap.sh root@176.124.210.254:/root/`

### 4.3 Клонирование

```bash
mkdir -p /opt/tracker
chown -R deploy:deploy /opt/tracker   # если используете deploy
su - deploy
git clone https://github.com/Allen-1-web/Tracker.git /opt/tracker
cd /opt/tracker
```

### 4.4 Секреты с вашего ПК

**После шага 1** (новый токен в `deploy/local/bot.env.production`):

```powershell
cd c:\Users\Дмитрий\Tracker
scp frontend/.env.production deploy@176.124.210.254:/opt/tracker/frontend/
scp .env deploy@176.124.210.254:/opt/tracker/
scp deploy/local/bot.env.production deploy@176.124.210.254:/opt/tracker/bot/.env
```

Если пользователь только `root`:

```powershell
scp frontend/.env.production root@176.124.210.254:/opt/tracker/frontend/
scp .env root@176.124.210.254:/opt/tracker/
scp deploy/local/bot.env.production root@176.124.210.254:/opt/tracker/bot/.env
```

### 4.5 Запуск

```bash
cd /opt/tracker
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Если `bot-webhook` / `bot-worker` в статусе **Restarting**:

```bash
docker compose -f docker-compose.prod.yml logs --tail=60 bot-webhook
docker compose -f docker-compose.prod.yml logs --tail=60 bot-worker
```

Типичные строки в логах:

| Сообщение | Решение |
|-----------|---------|
| `Invalid bot environment` | Проверить `bot/.env` (токен, Supabase URL/keys, webhook secrets ≥16 символов) |
| `FATAL: ... 401` / `Unauthorized` | Новый токен в BotFather → обновить `bot/.env` → `restart` |
| `relation "telegram_users" does not exist` | Шаг 3.4 — миграции в SQL Editor |
| `redis: connection error` | `docker compose ps` — redis должен быть healthy |

Откройте в браузере: **http://ptnway.ru**

---

## Шаг 5. HTTPS (~5 мин)

На сервере (замените email):

```bash
sudo certbot certonly --webroot -w /opt/tracker/deploy/certbot/www \
  -d ptnway.ru -d www.ptnway.ru \
  --agree-tos -m ваш@email.ru --non-interactive

cd /opt/tracker
cp deploy/nginx/tracker.ssl.conf.example deploy/nginx/conf.d/tracker.ssl.conf
rm deploy/nginx/conf.d/tracker.conf
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

Проверка: **https://ptnway.ru** и команда `/start` у @Track_Luffy_bot.

---

## Шаг 6. CI/CD (по желанию)

GitHub → репозиторий **Allen-1-web/Tracker** → **Settings** → **Secrets**:

| Secret | Значение |
|--------|----------|
| `DEPLOY_HOST` | `176.124.210.254` |
| `DEPLOY_USER` | `deploy` или `root` |
| `DEPLOY_SSH_KEY` | приватный SSH-ключ |
| `DEPLOY_PATH` | `/opt/tracker` |

После этого push в `main` будет автоматически обновлять сервер.

---

## Если что-то не работает

```bash
docker compose -f docker-compose.prod.yml logs --tail=80 frontend
docker compose -f docker-compose.prod.yml logs --tail=80 bot-webhook
docker compose -f docker-compose.prod.yml logs --tail=80 nginx
```

Пришлите вывод — разберём по месту.
