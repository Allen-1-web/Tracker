import { run, type RunnerHandle } from '@grammyjs/runner'
import { buildContainer } from './container.js'
import { createBot } from '../infrastructure/telegram/bot.js'

/**
 * Long-polling entry-point бота.
 *
 * Запуск:
 *   npm run dev:bot      (tsx watch)
 *   npm run start:bot    (production polling)
 *
 * Для webhook в production см. start-webhook.ts (Stage 7).
 */
async function bootstrap(): Promise<void> {
  const container = buildContainer()
  const { log, config } = container

  // ранний sanity-check Supabase: дешёвый запрос, заодно проверяет сеть и доступ
  try {
    await container.repositories.telegramUsers.findByChatId(0)
    log.info('supabase: connection OK')
  } catch (err) {
    log.error(
      { err },
      'supabase: connection FAILED — проверьте SUPABASE_URL/SERVICE_ROLE_KEY и миграции (20260524 + 20260524b)',
    )
    throw err
  }

  // best-effort очистка просроченных токенов на старте
  const cleaned = await container.repositories.linkTokens.cleanupExpired()
  if (cleaned > 0) log.info({ cleaned }, 'link-tokens: cleaned expired')

  const bot = createBot(container)
  await bot.init()
  log.info(
    { bot: bot.botInfo.username, mode: config.telegram.mode },
    'bot: initialized',
  )

  if (config.telegram.mode === 'webhook') {
    log.warn(
      'TELEGRAM_MODE=webhook — используйте start-webhook.ts (npm run start:webhook), не polling.',
    )
    process.exit(1)
  }

  const runner: RunnerHandle = run(bot, {
    runner: {
      fetch: { allowed_updates: ['message', 'callback_query'] },
    },
  })

  log.info('bot: polling started')

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'bot: shutting down')
    try {
      if (runner.isRunning()) await runner.stop()
      log.info('bot: stopped cleanly')
      process.exit(0)
    } catch (err) {
      log.error({ err }, 'bot: error during shutdown')
      process.exit(1)
    }
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  // если контейнер ещё не собран — упадём прежде чем получим логгер
  // (loadConfig прокинет понятную Zod-ошибку в stderr)
  // eslint-disable-next-line no-console
  console.error('FATAL: bot bootstrap failed', err)
  process.exit(1)
})
