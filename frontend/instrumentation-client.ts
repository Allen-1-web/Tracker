import * as Sentry from '@sentry/nextjs'
import { getSentryOptions } from '@/lib/sentry/options'

Sentry.init({
  ...getSentryOptions(),
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1 : 0,
})
