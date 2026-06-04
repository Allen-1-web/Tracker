# Timeweb: быстрый старт (с нуля)

Репозиторий: `https://github.com/Allen-1-web/Tracker.git`

## Фаза A — локально (сейчас)

### 1. Отзовите токен бота

В @BotFather → `/revoke` → новый токен → вставьте в `bot/.env` и в `deploy/local/bot.env.production`.

### 2. Запушьте код с деплоем

Файлы Docker/nginx ещё не в `origin/main`. Из корня `Tracker`:

```powershell
git add DEPLOY.md docker-compose.prod.yml frontend/Dockerfile deploy/ .github/workflows/deploy.yml
git add frontend/next.config.ts frontend/.env.production.example package.json .gitignore README.md .dockerignore
git add bot/ docker-compose.yml frontend/.dockerignore
git status
git commit -m "Add production Docker, nginx, and Timeweb deploy docs"
git push origin main
```

(Добавьте в `git add` остальные нужные папки проекта, если они ещё не в репозитории.)

### 3. Локальные env (уже подготовлены)

| Файл | Назначение |
|------|------------|
| `frontend/.env.production` | runtime Next.js |
| `.env` | build-args для `docker compose build` |
| `deploy/local/bot.env.production` | шаблон для сервера → `bot/.env` |

Замените `YOUR_DOMAIN` на реальный домен после покупки в Timeweb.

---

## Фаза B — Timeweb Cloud

### 1. VPS

- [timeweb.cloud](https://timeweb.cloud) → **Облачные серверы** → **Создать**
- Ubuntu **24.04 LTS**, **2 vCPU / 2 GB / 30 GB SSD**
- SSH-ключ (публичный) — сохраните доступ

### 2. Домен

- **Домены** → купить/привязать домен
- DNS: **A** `@` → IP VPS (и `www` при необходимости)
- Проверка: `nslookup ваш-домен.ru`

### 3. SSH на сервер

```powershell
ssh root@IP_ВАШЕГО_VPS
```

Скопируйте bootstrap (или вручную из `DEPLOY.md`):

```bash
# с вашего ПК после push:
scp deploy/scripts/vps-bootstrap.sh root@IP:/root/
ssh root@IP 'bash /root/vps-bootstrap.sh'
```

### 4. Клонирование и env

```bash
ssh deploy@IP
sudo git clone https://github.com/Allen-1-web/Tracker.git /opt/tracker
sudo chown -R deploy:deploy /opt/tracker
cd /opt/tracker
```

С ПК скопируйте секреты (не коммитьте в git):

```powershell
scp frontend/.env.production deploy@IP:/opt/tracker/frontend/
scp .env deploy@IP:/opt/tracker/
scp deploy/local/bot.env.production deploy@IP:/opt/tracker/bot/.env
```

На сервере:

```bash
nano bot/.env                    # YOUR_DOMAIN → https://ваш-домен.ru, новый BOT_TOKEN, service_role
nano deploy/nginx/conf.d/tracker.conf   # app.example.ru → ваш-домен.ru
```

### 5. Supabase Dashboard

Authentication → URL configuration:

- Site URL: `https://ваш-домен.ru`
- Redirect URLs: `https://ваш-домен.ru/**`

### 6. Запуск (HTTP)

```bash
cd /opt/tracker
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f bot-webhook
```

Откройте `http://ваш-домен.ru` — должен открыться сайт.

### 7. HTTPS

```bash
sudo certbot certonly --webroot -w /opt/tracker/deploy/certbot/www \
  -d ваш-домен.ru --agree-tos -m ваш@email.ru --non-interactive

cp deploy/nginx/conf.d/tracker.ssl.conf.example deploy/nginx/conf.d/tracker.ssl.conf
sed -i 's/app.example.ru/ваш-домен.ru/g' deploy/nginx/conf.d/tracker.ssl.conf
rm deploy/nginx/conf.d/tracker.conf
nano bot/.env   # TELEGRAM_WEBHOOK_BASE_URL=https://ваш-домен.ru
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 8. Проверка

- `https://ваш-домен.ru` — логин
- Telegram `/start` — ответ бота
- Логи: `webhook: registered with Telegram`

---

## CI/CD (позже)

GitHub → Settings → Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`=`/opt/tracker`.
