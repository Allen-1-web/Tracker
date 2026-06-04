import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import { requireLinkedAccount } from '../middleware/auth.js'

export const whoamiCommand = new Composer<AppContext>()

whoamiCommand.command('whoami', requireLinkedAccount(), async (ctx) => {
  const u = ctx.linkedUser!
  const lines = [
    '👤 <b>Текущая связка</b>',
    `account_id: <code>${u.userId}</code>`,
    `chat_id: <code>${u.telegramChatId}</code>`,
    `username: ${u.username ? `@${u.username}` : '—'}`,
    `timezone: <code>${u.timezone}</code>`,
    `quiet hours: ${u.quietHoursStart && u.quietHoursEnd ? `${u.quietHoursStart}–${u.quietHoursEnd}` : '—'}`,
    `подключён: ${u.linkedAt.toLocaleString('ru-RU')}`,
  ]
  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' })
})
