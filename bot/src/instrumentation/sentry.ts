import 'dotenv/config'
import * as Sentry from '@sentry/node'

const dsn = (process.env.SENTRY_DSN ?? '').trim()
let initialized = false

function tracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE
  if (raw) {
    const parsed = Number(raw)
    if (!Number.isNaN(parsed)) return parsed
  }
  return process.env.NODE_ENV === 'production' ? 0.1 : 1
}

/** Call once at process startup (before other imports side-effects when possible). */
export function initSentry(service: 'bot-webhook' | 'bot-worker' | 'bot-polling'): void {
  if (initialized || !dsn) return
  initialized = true

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: tracesSampleRate(),
    serverName: service,
    sendDefaultPii: false,
  })
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!dsn) return
  Sentry.withScope((scope) => {
    if (context) scope.setContext('extra', context)
    Sentry.captureException(error)
  })
}

export function isSentryEnabled(): boolean {
  return Boolean(dsn)
}
