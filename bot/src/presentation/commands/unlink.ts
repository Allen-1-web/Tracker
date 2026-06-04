import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import { requireLinkedAccount } from '../middleware/auth.js'

export const unlinkCommand = new Composer<AppContext>()

unlinkCommand.command('unlink', requireLinkedAccount(), async (ctx) => {
  if (!ctx.chat) return
  await ctx.container.services.accountLink.unlinkByChatId(ctx.chat.id)
  await ctx.reply(
    '🔌 Аккаунт отвязан от этого Telegram.\n\n' +
      'Уведомления больше приходить не будут. ' +
      'Чтобы снова подключить — откройте «Настройки» в веб-приложении.',
  )
})
