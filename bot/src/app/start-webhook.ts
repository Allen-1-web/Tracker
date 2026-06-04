import { buildContainer } from './container.js'
import { createBot, initBotWithTimeout, probeTelegramApi } from '../infrastructure/telegram/bot.js'
import { createRedisConnection } from '../infrastructure/redis/client.js'
import {
  attachWebhookRoute,
  createBotHttpServerBase,
  registerTelegramWebhook,
} from '../infrastructure/http/server.js'

/**
 * Production entry-point: Fastify webhook + /healthz + /metrics.
 */
async function bootstrap(): Promise<void> {
  const container = buildContainer()
  const { log, config } = container

  if (config.telegram.mode !== 'webhook' || !config.telegram.webhook) {
    throw new Error(
      'start-webhook requires TELEGRAM_MODE=webhook and TELEGRAM_WEBHOOK_* env vars',
    )
  }

  try {
    await container.repositories.telegramUsers.findByChatId(0)
    log.info('supabase: connection OK')
  } catch (err) {
    log.error(
      { err },
      'supabase: connection FAILED — примените backend/supabase/migrations/20260524*.sql в Supabase SQL Editor',
    )
  }

  const cleaned = await container.repositories.linkTokens.cleanupExpired()
  if (cleaned > 0) log.info({ cleaned }, 'link-tokens: cleaned expired')

  const redis = createRedisConnection(config)
  redis.on('error', (err: Error) => log.error({ err }, 'redis: connection error'))
  await new Promise<void>((resolve, reject) => {
    if (redis.status === 'ready') {
      resolve()
      return
    }
    redis.once('ready', () => resolve())
    redis.once('error', (err: Error) => reject(err))
  })
  log.info('redis: connection OK')

  // Слушаем порт до bot.init() — иначе nginx → 502, пока init висит.
  const app = await createBotHttpServerBase({
    config,
    log,
    telegramUsers: container.repositories.telegramUsers,
    redis,
  })

  log.info('telegram: probing API (getMe)...')
  await probeTelegramApi(config.telegram.token)
  log.info('telegram: API OK')

  const bot = createBot(container)
  await initBotWithTimeout(bot, log)

  attachWebhookRoute({ app, bot, config, log })

  try {
    await registerTelegramWebhook({ bot, config, log })
  } catch (err) {
    log.error({ err }, 'webhook: setWebhook failed — проверьте HTTPS и TELEGRAM_WEBHOOK_BASE_URL')
    for (let attempt = 2; attempt <= 5; attempt++) {
      await new Promise((r) => setTimeout(r, 10_000))
      try {
        await registerTelegramWebhook({ bot, config, log })
        break
      } catch (retryErr) {
        log.error({ err: retryErr, attempt }, 'webhook: setWebhook retry failed')
      }
    }
  }

  try {
    const info = await bot.api.getWebhookInfo()
    if (!info.url) {
      log.error(
        { lastError: info.last_error_message ?? null },
        'webhook: Telegram не знает URL — запустите deploy/scripts/telegram-webhook.sh на VPS',
      )
    } else if (info.last_error_message) {
      log.warn(
        { url: info.url, lastError: info.last_error_message, pending: info.pending_update_count },
        'webhook: Telegram сообщает об ошибке доставки',
      )
    }
  } catch (err) {
    log.error({ err }, 'webhook: getWebhookInfo failed')
  }

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'webhook: shutting down')
    try {
      await app.close()
      await redis.quit()
      log.info('webhook: stopped cleanly')
      process.exit(0)
    } catch (err) {
      log.error({ err }, 'webhook: error during shutdown')
      process.exit(1)
    }
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FATAL: webhook bootstrap failed', err)
  process.exit(1)
})
