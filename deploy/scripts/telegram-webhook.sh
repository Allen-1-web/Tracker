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

echo "=== nginx conf.d (должны быть только 00-upstreams.conf + tracker.ssl.conf) ==="
ls -la "$ROOT/deploy/nginx/conf.d/" 2>/dev/null || true
for extra in "$ROOT/deploy/nginx/conf.d/tracker.conf" "$ROOT/deploy/nginx/conf.d/"*.example; do
  if [[ -f "$extra" ]]; then
    echo "⚠ Удалите лишний конфиг: rm -f $extra"
  fi
done
echo
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
  echo "=== setWebhook → ${URL} (drop pending) ==="
  SET_BODY="$(python3 - <<PY
import json, os
print(json.dumps({
  "url": "${URL}",
  "secret_token": os.environ.get("TELEGRAM_WEBHOOK_HEADER_SECRET", ""),
  "allowed_updates": ["message", "callback_query"],
  "drop_pending_updates": True,
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

  echo "=== POST напрямую на bot :3001 (минуя nginx) ==="
  DIRECT_CODE="$(curl -sS -m 15 -o /dev/null -w "%{http_code}" -X POST \
    "http://127.0.0.1:3001/tg/webhook/${TELEGRAM_WEBHOOK_PATH_SECRET}" \
    -H "Content-Type: application/json" \
    -H "X-Telegram-Bot-Api-Secret-Token: ${TELEGRAM_WEBHOOK_HEADER_SECRET}" \
    -d '{"update_id":9001,"message":{"message_id":1,"date":1700000000,"chat":{"id":1,"type":"private"},"from":{"id":1,"is_bot":false,"first_name":"T"},"text":"/ping"}}' \
    2>/dev/null || echo "000")"
  echo "POST 127.0.0.1:3001 → HTTP ${DIRECT_CODE} (200/204 нормально)"
  echo

  echo "=== HTTPS endpoint (POST через nginx) ==="
  HTTPS_CODE="$(curl -sS -m 15 -o /dev/null -w "%{http_code}" -X POST "${URL}" \
    -H "Content-Type: application/json" \
    -H "X-Telegram-Bot-Api-Secret-Token: ${TELEGRAM_WEBHOOK_HEADER_SECRET}" \
    -d '{"update_id":9002,"message":{"message_id":2,"date":1700000000,"chat":{"id":1,"type":"private"},"from":{"id":1,"is_bot":false,"first_name":"T"},"text":"/ping"}}' \
    2>/dev/null || echo "000")"
  echo "POST ${URL} → HTTP ${HTTPS_CODE}"
  echo "(502/000 — nginx→bot; 200 — цепочка работает; Telegram timeout — см. DNS AAAA / firewall Timeweb)"
  echo

  echo "=== DNS AAAA (если есть запись — удалите в Timeweb DNS) ==="
  dig +short ptnway.ru AAAA 2>/dev/null || echo "(dig не установлен)"
  echo
fi

echo "=== Telegram API from bot-webhook container ==="
"${COMPOSE[@]}" exec -T bot-webhook node -e \
  "fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/getMe',{signal:AbortSignal.timeout(15000)}).then(r=>r.json()).then(j=>console.log(JSON.stringify(j,null,2))).catch(e=>console.error('FAIL',e.message))" \
  2>/dev/null || echo "не удалось проверить api.telegram.org из контейнера"
echo

echo "=== bot health (node, inside container) ==="
"${COMPOSE[@]}" exec -T bot-webhook node -e \
  "fetch('http://127.0.0.1:3001/livez').then(r=>r.text().then(t=>console.log('livez',r.status,t))).catch(e=>{console.error('FAIL',e.message);process.exit(1)})" \
  2>/dev/null || echo "bot-webhook: exec failed (контейнер не запущен?)"
echo

echo "=== nginx → bot (host network :3001) ==="
"${COMPOSE[@]}" exec -T nginx wget -qO- "http://host.docker.internal:3001/livez" 2>/dev/null \
  || echo "nginx не достучался до host.docker.internal:3001"
echo
