import type { AppContext } from '../context.js'
import type { LinkedUser } from '../../domain/user.js'
import {
  formatGoalsMessage,
  formatHabitsMessage,
  formatNutritionMessage,
  formatReportMessage,
  formatSettingsMessage,
  formatWelcomeLinked,
  habitsKeyboard,
  mainMenuKeyboard,
  backToMenuKeyboard,
} from '../markup/tracker-messages.js'

export async function sendMainMenu(ctx: AppContext, firstName: string): Promise<void> {
  await ctx.reply(formatWelcomeLinked(firstName), {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(),
  })
}

export async function sendHabitsView(ctx: AppContext, linked: LinkedUser): Promise<void> {
  const { date, items } = await ctx.container.services.habits.listToday(
    linked.userId,
    linked.timezone,
  )
  await ctx.reply(formatHabitsMessage(date, items), {
    parse_mode: 'Markdown',
    reply_markup: habitsKeyboard(items),
  })
}

export async function sendGoalsView(ctx: AppContext, linked: LinkedUser): Promise<void> {
  const items = await ctx.container.services.goals.listActive(linked.userId)
  await ctx.reply(formatGoalsMessage(items), {
    parse_mode: 'Markdown',
    reply_markup: backToMenuKeyboard(),
  })
}

export async function sendNutritionView(ctx: AppContext, linked: LinkedUser): Promise<void> {
  const summary = await ctx.container.services.nutrition.todaySummary(
    linked.userId,
    linked.timezone,
  )
  await ctx.reply(formatNutritionMessage(summary), {
    parse_mode: 'Markdown',
    reply_markup: backToMenuKeyboard(),
  })
}

export async function sendReportView(ctx: AppContext, linked: LinkedUser): Promise<void> {
  const report = await ctx.container.services.report.buildDaily(linked.userId, linked.timezone)
  await ctx.reply(formatReportMessage(report), {
    parse_mode: 'Markdown',
    reply_markup: backToMenuKeyboard(),
  })
}

export async function sendSettingsView(ctx: AppContext, linked: LinkedUser): Promise<void> {
  await ctx.reply(formatSettingsMessage(linked), {
    parse_mode: 'Markdown',
    reply_markup: backToMenuKeyboard(),
  })
}

export async function editHabitsView(
  ctx: AppContext,
  linked: LinkedUser,
  messageId: number,
): Promise<void> {
  const { date, items } = await ctx.container.services.habits.listToday(
    linked.userId,
    linked.timezone,
  )
  await ctx.api.editMessageText(ctx.chat!.id, messageId, formatHabitsMessage(date, items), {
    parse_mode: 'Markdown',
    reply_markup: habitsKeyboard(items),
  })
}
