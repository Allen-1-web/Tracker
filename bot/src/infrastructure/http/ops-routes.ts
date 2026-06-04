import type { FastifyInstance } from 'fastify'
import type { Redis } from 'ioredis'
import type { TelegramUserRepository } from '../supabase/repositories/telegram-user.repository.js'
import type { AppLogger } from '../logger.js'
import { buildHealthReport } from './health.js'
import { metrics, MetricNames } from '../metrics/registry.js'

export function registerOpsRoutes(
  app: FastifyInstance,
  args: {
    log: AppLogger
    telegramUsers: TelegramUserRepository
    redis: Redis | null
  },
): void {
  const { log, telegramUsers, redis } = args

  app.get('/healthz', async (_req, reply) => {
    const report = await buildHealthReport({ telegramUsers, redis })
    const code = report.status === 'ok' ? 200 : 503
    return reply.code(code).send(report)
  })

  app.get('/metrics', async (_req, reply) => {
    return reply.type('text/plain; version=0.0.4; charset=utf-8').send(metrics.renderPrometheus())
  })

  app.setNotFoundHandler((req, reply) => {
    metrics.inc(MetricNames.httpRequests, { route: 'unknown', method: req.method, status: '404' })
    return reply.code(404).send({ error: 'not_found' })
  })

  app.addHook('onResponse', (req, reply, done) => {
    const route = req.routeOptions.url ?? req.url
    metrics.inc(MetricNames.httpRequests, {
      route,
      method: req.method,
      status: String(reply.statusCode),
    })
    done()
  })

  app.addHook('onError', (req, _reply, err, done) => {
    log.error({ err, url: req.url, method: req.method }, 'http: request error')
    done()
  })
}
