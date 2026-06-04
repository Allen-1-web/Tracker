import { Composer } from 'grammy'
import type { AppContext } from '../context.js'

export const helpCommand = new Composer<AppContext>()

helpCommand.command('help', async (ctx) => {
  const linked = ctx.chat
    ? await ctx.container.services.accountLink.getByChatId(ctx.chat.id)
    : null

  if (!linked) {
    await ctx.reply(
      'Доступные команды:\n' +
        '/start — приветствие и подключение аккаунта\n' +
        '/help — эта справка\n' +
        '/ping — проверка связи\n\n' +
        '🔌 Чтобы открыть все возможности — подключите аккаунт в «Настройках» веб-приложения.',
    )
    return
  }

  await ctx.reply(
    'Команды:\n' +
      '/menu — главное меню\n' +
      '/habits — привычки на сегодня (чекины)\n' +
      '/goals — активные цели\n' +
      '/nutrition — питание за сегодня\n' +
      '/report — сводка дня\n' +
      '/reminders — напоминания (список, вкл/выкл, добавить)\n' +
      '/settings — настройки Telegram\n' +
      '/whoami — моя связка\n' +
      '/unlink — отвязать аккаунт\n' +
      '/help — эта справка\n' +
      '/ping — проверка связи\n\n' +
      'Добавить напоминание: `/reminders add 09:00 Текст`\n\n' +
      '_Автоматически (нужен worker): ежедневная сводка, еженедельный отчёт, напоминания о воде, алерты о пропущенных привычках — по настройкам в БД._',
  )
})
