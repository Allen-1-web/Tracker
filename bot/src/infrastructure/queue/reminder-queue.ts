import { Queue, Worker, type ConnectionOptions } from 'bullmq'
import type { Redis } from 'ioredis'
import type { AppConfig } from '../config.js'
import type { AppLogger } from '../logger.js'
import type { ReminderDispatchService } from '../../application/services/reminder-dispatch.service.js'
import type { DigestNotificationService } from '../../application/services/digest-notification.service.js'
import { REMINDER_JOB_DISPATCH, REMINDER_JOB_SCHEDULER_TICK, REMINDER_QUEUE, SCHEDULER_TICK_MS } from './constants.js'
import type { DispatchReminderJobData } from './reminder-jobs.js'
import { metrics, MetricNames } from '../metrics/registry.js'

export function createReminderQueue(redis: Redis, config: AppConfig): Queue {
  return new Queue(REMINDER_QUEUE, {
    connection: redis as ConnectionOptions,
    prefix: config.redis.bullPrefix,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
  })
}

export async function ensureSchedulerRepeatableJob(
  queue: Queue,
  log: AppLogger,
): Promise<void> {
  const repeatable = await queue.getRepeatableJobs()
  const exists = repeatable.some((j) => j.name === REMINDER_JOB_SCHEDULER_TICK)
  if (exists) return

  await queue.add(
    REMINDER_JOB_SCHEDULER_TICK,
    {},
    {
      repeat: { every: SCHEDULER_TICK_MS },
      jobId: 'reminder-scheduler-tick',
    },
  )
  log.info({ everyMs: SCHEDULER_TICK_MS }, 'reminder-queue: scheduler repeatable job registered')
}

export function createReminderWorker(args: {
  redis: Redis
  config: AppConfig
  dispatch: ReminderDispatchService
  digest: DigestNotificationService
  log: AppLogger
}): Worker {
  const { redis, config, dispatch, digest, log } = args

  const worker = new Worker(
    REMINDER_QUEUE,
    async (job) => {
      if (job.name === REMINDER_JOB_SCHEDULER_TICK) {
        const [reminderCount, digestCount] = await Promise.all([
          dispatch.processDueReminders(),
          digest.processAutomatedNotifications(),
        ])
        if (reminderCount > 0) {
          metrics.inc(MetricNames.remindersSent, {}, reminderCount)
          log.info({ count: reminderCount }, 'reminder-scheduler: processed due reminders')
        }
        if (digestCount > 0) {
          metrics.inc(MetricNames.digestsSent, {}, digestCount)
          log.info({ count: digestCount }, 'digest-scheduler: sent automated notifications')
        }
        metrics.inc(MetricNames.workerJobs, { job: REMINDER_JOB_SCHEDULER_TICK, result: 'ok' })
        return
      }

      if (job.name === REMINDER_JOB_DISPATCH) {
        const data = job.data as DispatchReminderJobData
        await dispatch.dispatch(data.reminderId)
        metrics.inc(MetricNames.workerJobs, { job: REMINDER_JOB_DISPATCH, result: 'ok' })
        return
      }

      log.warn({ jobName: job.name }, 'reminder-worker: unknown job')
      metrics.inc(MetricNames.workerJobs, { job: job.name, result: 'unknown' })
    },
    {
      connection: redis as ConnectionOptions,
      prefix: config.redis.bullPrefix,
      concurrency: 5,
    },
  )

  worker.on('failed', (job, err) => {
    metrics.inc(MetricNames.workerJobs, { job: job?.name ?? 'unknown', result: 'failed' })
    log.error({ jobId: job?.id, jobName: job?.name, err }, 'reminder-worker: job failed')
  })

  return worker
}
