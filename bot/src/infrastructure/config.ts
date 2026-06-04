import 'dotenv/config'
import { z } from 'zod'

/**
 * dotenv грузит `KEY=` как пустую строку, а не как undefined.
 * Этот хелпер делает «`''` → undefined», чтобы `.optional()` срабатывал ожидаемо.
 */
const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : v)

const optionalStr = (schema: z.ZodString) =>
  z.preprocess((v) => {
    const t = trim(v)
    return t === '' || t == null ? undefined : t
  }, schema.optional())

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .default('info'),

    TELEGRAM_BOT_TOKEN: z.preprocess(trim, z.string().min(20, 'TELEGRAM_BOT_TOKEN is required')),
    TELEGRAM_BOT_USERNAME: optionalStr(z.string().min(1)),
    TELEGRAM_MODE: z.enum(['polling', 'webhook']).default('polling'),
    TELEGRAM_WEBHOOK_BASE_URL: optionalStr(z.string().url()),
    TELEGRAM_WEBHOOK_PATH_SECRET: optionalStr(z.string().min(16)),
    TELEGRAM_WEBHOOK_HEADER_SECRET: optionalStr(z.string().min(16)),

    HTTP_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    HTTP_HOST: z.string().default('0.0.0.0'),
    WORKER_HTTP_PORT: z.coerce.number().int().min(1).max(65535).default(3002),

    SUPABASE_URL: z.preprocess(
      trim,
      z.string().url('SUPABASE_URL must be a valid URL (e.g. https://xxxx.supabase.co)'),
    ),
    SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
      trim,
      z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    ),

    REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
    BULLMQ_PREFIX: z.string().min(1).default('tracker'),

    DEFAULT_TIMEZONE: z.string().min(1).default('Europe/Moscow'),
    DEFAULT_LOCALE: z.string().min(2).max(8).default('ru'),
  })
  .superRefine((env, ctx) => {
    if (env.TELEGRAM_MODE === 'webhook') {
      if (!env.TELEGRAM_WEBHOOK_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TELEGRAM_WEBHOOK_BASE_URL'],
          message: 'Required when TELEGRAM_MODE=webhook',
        })
      }
      if (!env.TELEGRAM_WEBHOOK_PATH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TELEGRAM_WEBHOOK_PATH_SECRET'],
          message: 'Required when TELEGRAM_MODE=webhook',
        })
      }
      if (!env.TELEGRAM_WEBHOOK_HEADER_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TELEGRAM_WEBHOOK_HEADER_SECRET'],
          message: 'Required when TELEGRAM_MODE=webhook',
        })
      }
    }
  })

export type Env = z.infer<typeof EnvSchema>

export type AppConfig = {
  env: Env['NODE_ENV']
  logLevel: Env['LOG_LEVEL']
  telegram: {
    token: string
    username: string | undefined
    mode: Env['TELEGRAM_MODE']
    webhook:
      | {
          baseUrl: string
          pathSecret: string
          headerSecret: string
          fullPath: string
          fullUrl: string
        }
      | null
  }
  http: { host: string; port: number; workerPort: number }
  supabase: { url: string; serviceRoleKey: string }
  redis: { url: string; bullPrefix: string }
  defaults: { timezone: string; locale: string }
}

let cached: AppConfig | null = null

export function loadConfig(): AppConfig {
  if (cached) return cached

  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors
    const lines = Object.entries(formatted)
      .map(([k, v]) => `  - ${k}: ${(v ?? []).join('; ')}`)
      .join('\n')
    throw new Error(`Invalid bot environment:\n${lines}`)
  }

  const env = parsed.data
  const webhook =
    env.TELEGRAM_MODE === 'webhook' &&
    env.TELEGRAM_WEBHOOK_BASE_URL &&
    env.TELEGRAM_WEBHOOK_PATH_SECRET &&
    env.TELEGRAM_WEBHOOK_HEADER_SECRET
      ? {
          baseUrl: env.TELEGRAM_WEBHOOK_BASE_URL.replace(/\/+$/, ''),
          pathSecret: env.TELEGRAM_WEBHOOK_PATH_SECRET,
          headerSecret: env.TELEGRAM_WEBHOOK_HEADER_SECRET,
          fullPath: `/tg/webhook/${env.TELEGRAM_WEBHOOK_PATH_SECRET}`,
          fullUrl: `${env.TELEGRAM_WEBHOOK_BASE_URL.replace(/\/+$/, '')}/tg/webhook/${env.TELEGRAM_WEBHOOK_PATH_SECRET}`,
        }
      : null

  cached = {
    env: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    telegram: {
      token: env.TELEGRAM_BOT_TOKEN,
      username: env.TELEGRAM_BOT_USERNAME,
      mode: env.TELEGRAM_MODE,
      webhook,
    },
    http: { host: env.HTTP_HOST, port: env.HTTP_PORT, workerPort: env.WORKER_HTTP_PORT },
    supabase: {
      url: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    redis: { url: env.REDIS_URL, bullPrefix: env.BULLMQ_PREFIX },
    defaults: { timezone: env.DEFAULT_TIMEZONE, locale: env.DEFAULT_LOCALE },
  }

  return cached
}

/** Сброс кеша (для тестов). */
export function resetConfigCacheForTests(): void {
  cached = null
}
