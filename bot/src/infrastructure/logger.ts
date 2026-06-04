import pino, { type Logger, type LoggerOptions } from 'pino'
import { loadConfig } from './config.js'

let cached: Logger | null = null

export function getLogger(): Logger {
  if (cached) return cached

  const config = loadConfig()
  const isDev = config.env !== 'production'

  const options: LoggerOptions = {
    level: config.logLevel,
    base: { service: 'tracker-bot', env: config.env },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'config.telegram.token',
        'config.supabase.serviceRoleKey',
        'config.telegram.webhook.headerSecret',
        'config.telegram.webhook.pathSecret',
        '*.token',
        '*.password',
        '*.authorization',
        'req.headers.authorization',
      ],
      censor: '[REDACTED]',
    },
  }

  if (isDev) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname,service,env',
      },
    }
  }

  cached = pino(options)
  return cached
}

export type AppLogger = Logger

/** Создать дочерний логгер с дополнительным контекстом. */
export function childLogger(bindings: Record<string, unknown>): Logger {
  return getLogger().child(bindings)
}
