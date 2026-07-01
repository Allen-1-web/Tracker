function resolveDsn(): string {
  return (process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? '').trim()
}

function resolveEnvironment(): string {
  return process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'
}

function resolveTracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE
  if (raw) {
    const parsed = Number(raw)
    if (!Number.isNaN(parsed)) return parsed
  }
  return process.env.NODE_ENV === 'production' ? 0.1 : 1
}

/** Shared Sentry options for client, server, and edge runtimes. */
export function getSentryOptions() {
  const dsn = resolveDsn()
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: resolveEnvironment(),
    tracesSampleRate: resolveTracesSampleRate(),
    debug: process.env.SENTRY_DEBUG === 'true',
    sendDefaultPii: false,
  }
}
