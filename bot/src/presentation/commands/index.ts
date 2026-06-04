import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import { startCommand } from './start.js'
import { helpCommand } from './help.js'
import { unlinkCommand } from './unlink.js'
import { whoamiCommand } from './whoami.js'
import { miscCommands } from './misc.js'
import { trackerCommands } from './tracker.js'
import { remindersCommand } from './reminders.js'

/** Все команды бота, собранные в один Composer. */
export const commands = new Composer<AppContext>()
commands.use(startCommand)
commands.use(helpCommand)
commands.use(trackerCommands)
commands.use(remindersCommand)
commands.use(unlinkCommand)
commands.use(whoamiCommand)
commands.use(miscCommands)

/** Запасной обработчик для незнакомых текстовых сообщений в личном чате. */
commands.on('message:text', async (ctx, next) => {
  if (ctx.chat?.type !== 'private') return next()
  const text = ctx.message.text
  if (text.startsWith('/')) return next()
  await ctx.reply('Не понял. Доступные команды: /help')
})
