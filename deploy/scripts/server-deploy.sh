#!/usr/bin/env bash
# Run on VPS after git clone and .env files are in place.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/tracker}"
cd "$APP_DIR"

if [[ ! -f frontend/.env.production ]]; then
  echo "Missing frontend/.env.production — scp from your PC first."
  exit 1
fi
if [[ ! -f bot/.env ]]; then
  echo "Missing bot/.env — scp deploy/local/bot.env.production first."
  exit 1
fi
if [[ ! -f .env ]]; then
  echo "Missing root .env for docker build — scp from your PC first."
  exit 1
fi
if grep -q 'PASTE_NEW_TOKEN_FROM_BOTFATHER' bot/.env 2>/dev/null; then
  echo "Edit bot/.env: set TELEGRAM_BOT_TOKEN from BotFather (revoke old token first)."
  exit 1
fi

echo "==> docker compose build & up"
docker compose -f docker-compose.prod.yml up -d --build

echo "==> status"
docker compose -f docker-compose.prod.yml ps

echo "==> done. Open http://ptnway.ru (then HTTPS — see deploy/YOUR-STEPS.md)"
