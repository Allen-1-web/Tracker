#!/usr/bin/env bash
# Диагностика и перерегистрация Telegram webhook на VPS.
# Запуск: bash deploy/scripts/telegram-webhook.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT}/bot/.env"

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

echo "=== getWebhookInfo ==="
curl -fsS "${API}/getWebhookInfo" | python3 -m json.tool 2>/dev/null || curl -fsS "${API}/getWebhookInfo"
echo

if [[ -n "${TELEGRAM_WEBHOOK_BASE_URL:-}" && -n "${TELEGRAM_WEBHOOK_PATH_SECRET:-}" && -n "${TELEGRAM_WEBHOOK_HEADER_SECRET:-}" ]]; then
  BASE="${TELEGRAM_WEBHOOK_BASE_URL%/}"
  URL="${BASE}/tg/webhook/${TELEGRAM_WEBHOOK_PATH_SECRET}"
  echo "=== setWebhook → ${URL} ==="
  curl -fsS -X POST "${API}/setWebhook" \
    -d "url=${URL}" \
    -d "secret_token=${TELEGRAM_WEBHOOK_HEADER_SECRET}" \
    -d "allowed_updates[]=message" \
    -d "allowed_updates[]=callback_query" | python3 -m json.tool 2>/dev/null || true
  echo
  echo "=== getWebhookInfo (after) ==="
  curl -fsS "${API}/getWebhookInfo" | python3 -m json.tool 2>/dev/null || curl -fsS "${API}/getWebhookInfo"
  echo
fi

echo "=== bot health (docker internal) ==="
cd "$ROOT"
docker compose -f docker-compose.prod.yml exec -T bot-webhook wget -qO- http://127.0.0.1:3001/healthz 2>/dev/null || echo "bot-webhook недоступен"
echo

echo "=== nginx → bot (если curl с VPS) ==="
if [[ -n "${TELEGRAM_WEBHOOK_PATH_SECRET:-}" ]]; then
  curl -fsS -o /dev/null -w "HTTP %{http_code}\n" \
    "http://127.0.0.1/tg/webhook/${TELEGRAM_WEBHOOK_PATH_SECRET}" 2>/dev/null || echo "nginx /tg/ недоступен с localhost"
fi
