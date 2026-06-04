import Fastify from 'fastify'
import type { Redis } from 'ioredis'
import type { AppConfig } from '../config.js'
import type { AppLogger } from '../logger.js'
import type { TelegramUserRepository } from '../supabase/repositories/telegram-user.repository.js'
import { registerOpsRoutes } from './ops-routes.js'

/** Лёгкий HTTP только для /healthz и /metrics (worker-процесс). */
export async function createOpsHttpServer(args: {
  config: AppConfig
  log: AppLogger
  telegramUsers: TelegramUserRepository
  redis: Redis
  port: number
}) {
  const { config, log, telegramUsers, redis, port } = args

  const app = Fastify({ logger: false })
  registerOpsRoutes(app, { log, telegramUsers, redis })

  await app.listen({ host: config.http.host, port })
  log.info({ host: config.http.host, port }, 'ops: health/metrics server listening')
  return app
}
