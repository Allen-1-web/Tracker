#!/usr/bin/env bash
# Диагностика и перерегистрация Telegram webhook на VPS.
# Запуск: bash deploy/scripts/telegram-webhook.sh
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT}/bot/.env"
COMPOSE=(docker compose -f docker-compose.prod.yml)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "TELEGRAM_BOT_TOKEN пуст в bot/.env"
  exit 1
fi

API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"

echo "=== docker compose ps (bot + nginx) ==="
cd "$ROOT"
"${COMPOSE[@]}" ps bot-webhook bot-worker nginx redis 2>/dev/null || true
echo

echo "=== bot-webhook logs (last 15 lines) ==="
"${COMPOSE[@]}" logs --tail=15 bot-webhook 2>/dev/null || true
echo

echo "=== getWebhookInfo ==="
curl -sS "${API}/getWebhookInfo" | python3 -m json.tool 2>/dev/null || curl -sS "${API}/getWebhookInfo"
echo

if [[ -n "${TELEGRAM_WEBHOOK_BASE_URL:-}" && -n "${TELEGRAM_WEBHOOK_PATH_SECRET:-}" && -n "${TELEGRAM_WEBHOOK_HEADER_SECRET:-}" ]]; then
  BASE="${TELEGRAM_WEBHOOK_BASE_URL%/}"
  URL="${BASE}/tg/webhook/${TELEGRAM_WEBHOOK_PATH_SECRET}"
  echo "=== setWebhook → ${URL} ==="
  SET_BODY="$(python3 - <<PY
import json, os
print(json.dumps({
  "url": "${URL}",
  "secret_token": os.environ.get("TELEGRAM_WEBHOOK_HEADER_SECRET", ""),
  "allowed_updates": ["message", "callback_query"],
  "drop_pending_updates": False,
}))
PY
)"
  SET_RESP="$(curl -sS -X POST "${API}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "${SET_BODY}")"
  echo "${SET_RESP}" | python3 -m json.tool 2>/dev/null || echo "${SET_RESP}"
  if ! echo "${SET_RESP}" | grep -q '"ok":true'; then
    echo "⚠ setWebhook не удался — см. description выше (часто: нет HTTPS или bot-webhook не отвечает)"
  fi
  echo
  echo "=== getWebhookInfo (after) ==="
  curl -sS "${API}/getWebhookInfo" | python3 -m json.tool 2>/dev/null || curl -sS "${API}/getWebhookInfo"
  echo

  echo "=== HTTPS endpoint (POST test, ожидаем не 502/404) ==="
  HTTPS_CODE="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${URL}" \
    -H "Content-Type: application/json" \
    -H "X-Telegram-Bot-Api-Secret-Token: ${TELEGRAM_WEBHOOK_HEADER_SECRET}" \
    -d '{"update_id":0}' 2>/dev/null || echo "000")"
  echo "POST ${URL} → HTTP ${HTTPS_CODE}"
  echo "(403/401/400 от бота — нормально; 502/000 — nginx не достучался до bot-webhook)"
  echo
fi

echo "=== bot health (node, inside container) ==="
"${COMPOSE[@]}" exec -T bot-webhook node -e \
  "fetch('http://127.0.0.1:3001/livez').then(r=>r.text().then(t=>console.log('livez',r.status,t))).catch(e=>{console.error('FAIL',e.message);process.exit(1)})" \
  2>/dev/null || echo "bot-webhook: exec failed (контейнер не запущен?)"
echo

echo "=== nginx → bot-webhook (docker network) ==="
"${COMPOSE[@]}" exec -T nginx wget -qO- "http://bot-webhook:3001/livez" 2>/dev/null \
  || echo "nginx не достучался до bot-webhook:3001"
echo
