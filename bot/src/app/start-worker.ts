import { initSentry, captureException } from '../instrumentation/sentry.js'
import { Bot } from 'grammy'
import { buildContainer } from './container.js'
import { createRedisConnection } from '../infrastructure/redis/client.js'
import {
  createReminderQueue,
  createReminderWorker,
  ensureSchedulerRepeatableJob,
} from '../infrastructure/queue/reminder-queue.js'
import { REMINDER_JOB_SCHEDULER_TICK } from '../infrastructure/queue/constants.js'
import { createOpsHttpServer } from '../infrastructure/http/ops-server.js'

initSentry('bot-worker')

/** * BullMQ worker: due-напоминания + автоматические дайджесты (Stage 4–5).
 *
 * Запуск:
 *   npm run dev:worker
 *   npm run start:worker
 */
async function bootstrap(): Promise<void> {
  const container = buildContainer()
  const { log, config, services } = container

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

  const bot = new Bot(config.telegram.token)
  await bot.init()
  log.info({ bot: bot.botInfo.username }, 'worker: telegram bot ready')

  const dispatch = services.reminderDispatch.forBot(bot)
  const digest = services.digestDispatch.forBot(bot)

  const worker = createReminderWorker({ redis, config, dispatch, digest, log })
  const queue = createReminderQueue(redis, config)
  await ensureSchedulerRepeatableJob(queue, log)

  await queue.add(REMINDER_JOB_SCHEDULER_TICK, {}, { jobId: `boot-${Date.now()}` })

  const opsServer = await createOpsHttpServer({
    config,
    log,
    telegramUsers: container.repositories.telegramUsers,
    redis,
    port: config.http.workerPort,
  })

  log.info('worker: scheduler started (reminders + digests)')

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'worker: shutting down')
    try {
      await opsServer.close()
      await worker.close()
      await queue.close()
      redis.disconnect()
      log.info('worker: stopped cleanly')
      process.exit(0)
    } catch (err) {
      log.error({ err }, 'worker: error during shutdown')
      process.exit(1)
    }
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  captureException(err)
  // eslint-disable-next-line no-console
  console.error('FATAL: worker bootstrap failed', err)
  process.exit(1)
})
