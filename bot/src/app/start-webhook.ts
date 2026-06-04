import { buildContainer } from './container.js'
import { createBot, initBotWithTimeout } from '../infrastructure/telegram/bot.js'
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

  const app = await createBotHttpServerBase({
    config,
    log,
    telegramUsers: container.repositories.telegramUsers,
    redis,
  })

  const bot = createBot(container)
  attachWebhookRoute({ app, bot, config, log })

  // init + setWebhook в фоне: из Docker api.telegram.org иногда недоступен,
  // а webhook URL уже можно регистрировать с хоста (deploy/scripts/telegram-webhook.sh).
  void (async () => {
    try {
      await initBotWithTimeout(bot, log, 30_000)
      await registerTelegramWebhook({ bot, config, log })
      const info = await bot.api.getWebhookInfo()
      if (info.last_error_message) {
        log.warn(
          { url: info.url, lastError: info.last_error_message, pending: info.pending_update_count },
          'webhook: Telegram сообщает об ошибке доставки',
        )
      }
    } catch (err) {
      log.error(
        { err },
        'telegram: background init/setWebhook failed — если бот молчит, выполните: bash deploy/scripts/telegram-webhook.sh',
      )
    }
  })()

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
