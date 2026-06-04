import { Composer } from 'grammy'
import type { AppContext } from '../context.js'

export const miscCommands = new Composer<AppContext>()

miscCommands.command('ping', async (ctx) => {
  await ctx.reply('pong 🏓')
})

miscCommands.command('id', async (ctx) => {
  const u = ctx.from
  const lines = [
    `chat_id: <code>${ctx.chat?.id ?? '—'}</code>`,
    `user_id: <code>${u?.id ?? '—'}</code>`,
    `username: <code>${u?.username ?? '—'}</code>`,
    `language: <code>${u?.language_code ?? '—'}</code>`,
  ]
  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' })
})
