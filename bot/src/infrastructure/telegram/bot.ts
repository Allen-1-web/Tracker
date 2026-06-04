import { Bot } from 'grammy'
import type { Container } from '../../app/container.js'
import type { AppContext } from '../../presentation/context.js'
import { injectContainer } from '../../presentation/middleware/inject.js'
import { makeErrorHandler } from '../../presentation/middleware/error.js'
import { rateLimitPerChat } from '../../presentation/middleware/rate-limit.js'
import { commands } from '../../presentation/commands/index.js'
import { trackerCallbacks } from '../../presentation/callbacks/tracker.js'
import { reminderCallbacks } from '../../presentation/callbacks/reminders.js'

const TELEGRAM_API_TIMEOUT_SEC = 30

/**
 * Фабрика grammY бота со всеми middleware и обработчиками.
 * Не запускает polling/webhook — это делают entry-point'ы в app/.
 */
export function createBot(container: Container): Bot<AppContext> {
  const bot = new Bot<AppContext>(container.config.telegram.token, {
    client: { timeoutSeconds: TELEGRAM_API_TIMEOUT_SEC },
  })

  bot.use(injectContainer(container))
  bot.use(rateLimitPerChat())
  bot.use(trackerCallbacks)
  bot.use(reminderCallbacks)
  bot.use(commands)

  bot.catch(makeErrorHandler())

  return bot
}

export async function initBotWithTimeout(
  bot: Bot<AppContext>,
  log: { info: (obj: object, msg: string) => void },
  timeoutMs = 45_000,
): Promise<void> {
  log.info({}, 'bot: calling init()')
  await Promise.race([
    bot.init(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`bot.init() timed out after ${timeoutMs}ms`)), timeoutMs)
    }),
  ])
  log.info({ bot: bot.botInfo.username }, 'bot: initialized')
}
