import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import { requireLinkedAccount } from '../middleware/auth.js'
import {
  sendGoalsView,
  sendHabitsView,
  sendMainMenu,
  sendNutritionView,
  sendReportView,
  sendSettingsView,
} from '../views/tracker-views.js'

export const trackerCommands = new Composer<AppContext>()

const linked = requireLinkedAccount()

trackerCommands.command('menu', linked, async (ctx) => {
  const firstName = ctx.from?.first_name ?? 'друг'
  await sendMainMenu(ctx, firstName)
})

trackerCommands.command('habits', linked, async (ctx) => {
  await sendHabitsView(ctx, ctx.linkedUser!)
})

trackerCommands.command('goals', linked, async (ctx) => {
  await sendGoalsView(ctx, ctx.linkedUser!)
})

trackerCommands.command('nutrition', linked, async (ctx) => {
  await sendNutritionView(ctx, ctx.linkedUser!)
})

trackerCommands.command('report', linked, async (ctx) => {
  await sendReportView(ctx, ctx.linkedUser!)
})

trackerCommands.command('settings', linked, async (ctx) => {
  await sendSettingsView(ctx, ctx.linkedUser!)
})
