import Fastify, { type FastifyInstance } from 'fastify'
import { webhookCallback } from 'grammy'
import type { Bot } from 'grammy'
import type { Redis } from 'ioredis'
import type { AppConfig } from '../config.js'
import type { AppLogger } from '../logger.js'
import type { TelegramUserRepository } from '../supabase/repositories/telegram-user.repository.js'
import type { AppContext } from '../../presentation/context.js'
import { registerOpsRoutes } from './ops-routes.js'
import { metrics, MetricNames } from '../metrics/registry.js'

export type BotHttpServer = FastifyInstance

function buildFastifyApp(): FastifyInstance {
  return Fastify({
    logger: false,
    trustProxy: true,
    bodyLimit: 1_048_576,
  })
}

/** HTTP + /healthz — слушает порт до bot.init(), чтобы nginx не получал 502. */
export async function createBotHttpServerBase(args: {
  config: AppConfig
  log: AppLogger
  telegramUsers: TelegramUserRepository
  redis: Redis | null
}): Promise<FastifyInstance> {
  const { config, log, telegramUsers, redis } = args
  const app = buildFastifyApp()

  app.get('/livez', async (_req, reply) => reply.send({ ok: true }))

  registerOpsRoutes(app, { log, telegramUsers, redis })

  await app.listen({ host: config.http.host, port: config.http.port })
  log.info(
    { host: config.http.host, port: config.http.port },
    'http: server listening (health)',
  )

  return app
}

/** Регистрирует POST webhook после успешного bot.init(). */
export function attachWebhookRoute(args: {
  app: FastifyInstance
  bot: Bot<AppContext>
  config: AppConfig
  log: AppLogger
}): void {
  const { app, bot, config, log } = args
  const webhook = config.telegram.webhook
  if (!webhook) {
    throw new Error('attachWebhookRoute requires webhook config')
  }

  const handleWebhook = webhookCallback(bot, 'fastify', {
    secretToken: webhook.headerSecret,
    onTimeout: 'return',
    timeoutMilliseconds: 9_000,
  })

  app.post(webhook.fullPath, async (request, reply) => {
    try {
      await handleWebhook(request, reply)
      metrics.inc(MetricNames.webhookUpdates, { result: 'ok' })
    } catch (err) {
      metrics.inc(MetricNames.webhookUpdates, { result: 'error' })
      log.error({ err }, 'webhook: handler failed')
      if (!reply.sent) {
        return reply.code(500).send({ error: 'internal' })
      }
    }
  })

  log.info({ webhookPath: webhook.fullPath }, 'http: webhook route registered')
}

/** @deprecated Use createBotHttpServerBase + attachWebhookRoute */
export async function createBotHttpServer(args: {
  bot: Bot<AppContext>
  config: AppConfig
  log: AppLogger
  telegramUsers: TelegramUserRepository
  redis: Redis | null
}) {
  const { bot, config, log, telegramUsers, redis } = args
  const app = await createBotHttpServerBase({ config, log, telegramUsers, redis })
  attachWebhookRoute({ app, bot, config, log })
  return app
}

export async function registerTelegramWebhook(args: {
  bot: Bot<AppContext>
  config: AppConfig
  log: AppLogger
}): Promise<void> {
  const { bot, config, log } = args
  const webhook = config.telegram.webhook
  if (!webhook) return

  await bot.api.setWebhook(webhook.fullUrl, {
    secret_token: webhook.headerSecret,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  })

  const info = await bot.api.getWebhookInfo()
  log.info(
    {
      url: info.url,
      pending: info.pending_update_count,
      lastError: info.last_error_message ?? null,
    },
    'webhook: registered with Telegram',
  )
}
