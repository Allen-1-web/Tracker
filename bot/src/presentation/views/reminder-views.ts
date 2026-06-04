import type { AppContext } from '../context.js'
import type { LinkedUser } from '../../domain/user.js'
import {
  formatRemindersMessage,
  remindersKeyboard,
} from '../markup/reminder-messages.js'

export async function sendRemindersView(ctx: AppContext, linked: LinkedUser): Promise<void> {
  const items = await ctx.container.services.reminders.listForUser(
    linked.userId,
    linked.timezone,
  )
  await ctx.reply(formatRemindersMessage(items), {
    parse_mode: 'Markdown',
    reply_markup: remindersKeyboard(items),
  })
}

export async function editRemindersView(
  ctx: AppContext,
  linked: LinkedUser,
  messageId: number,
): Promise<void> {
  const items = await ctx.container.services.reminders.listForUser(
    linked.userId,
    linked.timezone,
  )
  await ctx.api.editMessageText(ctx.chat!.id, messageId, formatRemindersMessage(items), {
    parse_mode: 'Markdown',
    reply_markup: remindersKeyboard(items),
  })
}
