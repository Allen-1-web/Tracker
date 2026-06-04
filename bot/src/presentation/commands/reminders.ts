import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import { requireLinkedAccount } from '../middleware/auth.js'
import { sendRemindersView } from '../views/reminder-views.js'
import { isBotError } from '../../domain/errors.js'

export const remindersCommand = new Composer<AppContext>()

const linked = requireLinkedAccount()

const ADD_PATTERN = /^\/reminders(?:@\w+)?\s+add\s+(\d{1,2}:\d{2})\s+(.+)$/i

remindersCommand.command('reminders', linked, async (ctx) => {
  const text = ctx.message?.text?.trim() ?? ''
  const addMatch = ADD_PATTERN.exec(text)

  if (addMatch) {
    const time = addMatch[1]
    const title = addMatch[2]
    if (time && title) {
      try {
        await ctx.container.services.reminders.addDailyCustom(
          ctx.linkedUser!.userId,
          ctx.linkedUser!.timezone,
          time,
          title,
        )
        await ctx.reply('✅ Напоминание добавлено.')
      } catch (err) {
        if (isBotError(err)) {
          await ctx.reply(err.message)
          return
        }
        throw err
      }
    }
  }

  await sendRemindersView(ctx, ctx.linkedUser!)
})
