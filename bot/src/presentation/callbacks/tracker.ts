import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import { requireLinkedAccount } from '../middleware/auth.js'
import { parseHabitToggleCallback, parseMenuCallback, parseReminderToggleCallback } from '../../shared/validation/callbacks.js'
import {
  editHabitsView,
  sendGoalsView,
  sendHabitsView,
  sendMainMenu,
  sendNutritionView,
  sendReportView,
  sendSettingsView,
} from '../views/tracker-views.js'
import { sendRemindersView } from '../views/reminder-views.js'

export const trackerCallbacks = new Composer<AppContext>()

const linked = requireLinkedAccount()

trackerCallbacks.on('callback_query:data', linked, async (ctx, next) => {
  const data = ctx.callbackQuery.data
  const user = ctx.linkedUser!

  if (parseReminderToggleCallback(data)) return next()

  const menu = parseMenuCallback(data)
  if (menu) {
    await ctx.answerCallbackQuery()
    switch (menu) {
      case 'm:home':
        await sendMainMenu(ctx, ctx.from?.first_name ?? 'друг')
        break
      case 'm:hab':
        await sendHabitsView(ctx, user)
        break
      case 'm:gol':
        await sendGoalsView(ctx, user)
        break
      case 'm:nut':
        await sendNutritionView(ctx, user)
        break
      case 'm:rep':
        await sendReportView(ctx, user)
        break
      case 'm:rem':
        await sendRemindersView(ctx, user)
        break
      case 'm:set':
        await sendSettingsView(ctx, user)
        break
    }
    return
  }

  const habitId = parseHabitToggleCallback(data)
  if (habitId) {
    await ctx.container.services.habits.toggleToday(user.userId, habitId, user.timezone)
    await ctx.answerCallbackQuery({ text: 'Обновлено' })
    const messageId = ctx.callbackQuery.message?.message_id
    if (messageId != null) {
      await editHabitsView(ctx, user, messageId)
    } else {
      await sendHabitsView(ctx, user)
    }
    return
  }

  await ctx.answerCallbackQuery({ text: 'Неизвестная кнопка' })
})
