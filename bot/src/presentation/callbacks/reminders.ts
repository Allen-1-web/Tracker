import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import { requireLinkedAccount } from '../middleware/auth.js'
import { parseReminderToggleCallback } from '../../shared/validation/callbacks.js'
import { editRemindersView } from '../views/reminder-views.js'

export const reminderCallbacks = new Composer<AppContext>()

const linked = requireLinkedAccount()

reminderCallbacks.on('callback_query:data', linked, async (ctx, next) => {
  const reminderId = parseReminderToggleCallback(ctx.callbackQuery.data)
  if (!reminderId) return next()

  await ctx.container.services.reminders.toggleEnabled(ctx.linkedUser!.userId, reminderId)
  await ctx.answerCallbackQuery({ text: 'Обновлено' })

  const messageId = ctx.callbackQuery.message?.message_id
  if (messageId != null) {
    await editRemindersView(ctx, ctx.linkedUser!, messageId)
  }
})
