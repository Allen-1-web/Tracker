import { Composer } from 'grammy'
import type { AppContext } from '../context.js'
import {
  assertParseableStartPayload,
  parseStartPayload,
} from '../../shared/validation/start-payload.js'
import { sendMainMenu } from '../views/tracker-views.js'
import { mainMenuKeyboard } from '../markup/tracker-messages.js'

export const startCommand = new Composer<AppContext>()

startCommand.command('start', async (ctx) => {
  const payload = ctx.match?.toString() ?? ''
  const token = parseStartPayload(payload)
  const firstName = ctx.from?.first_name ?? 'друг'
  const chat = ctx.chat
  const tg = ctx.from

  if (!chat || !tg || chat.type !== 'private') {
    await ctx.reply(
      'Используйте этого бота в личном чате. Откройте профиль бота → «Запустить».',
    )
    return
  }

  // /start abc — payload есть, но не парсится → ошибка (до welcome-ветки)
  assertParseableStartPayload(payload, token)

  // /start без токена → приветствие + инструкция
  if (!token) {
    const linked = await ctx.container.services.accountLink.getByChatId(chat.id)
    if (linked) {
      await sendMainMenu(ctx, firstName)
      return
    }
    await ctx.reply(
      `Привет, ${firstName}! 👋\n\n` +
        'Я — бот трекера. Чтобы подключить аккаунт:\n' +
        '1. Откройте веб-приложение → «Настройки» → «Telegram-бот».\n' +
        '2. Нажмите «Сгенерировать ссылку».\n' +
        '3. Перейдите по ней — она запустит меня с одноразовым кодом.\n\n' +
        'После подключения здесь появятся команды: /help',
    )
    return
  }

  const result = await ctx.container.services.accountLink.linkAccount({
    token,
    contact: {
      telegramUserId: tg.id,
      telegramChatId: chat.id,
      username: tg.username ?? null,
      firstName: tg.first_name ?? null,
      lastName: tg.last_name ?? null,
      languageCode: tg.language_code ?? null,
    },
  })

  const tz = result.linkedUser.timezone
  await ctx.reply(
    `✅ Аккаунт подключён!\n\n` +
      (result.isFirstLink
        ? 'Я буду присылать сюда напоминания и отчёты.\n'
        : 'Связка обновлена для этого устройства.\n') +
      `Тайм-зона: ${tz} (изменить — в «Настройках»).\n\n` +
      'Откройте меню ниже или /help',
    { reply_markup: mainMenuKeyboard() },
  )
})
