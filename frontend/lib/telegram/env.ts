/** Username бота (без @). Прокидывается next.config.ts → NEXT_PUBLIC_TELEGRAM_BOT_USERNAME. */
export function getTelegramBotUsername(): string {
  const value =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ??
    process.env.TELEGRAM_BOT_USERNAME ??
    ''
  return value.trim().replace(/^@/, '')
}

/** Проверка, что бот сконфигурирован (для UI-предупреждений). */
export function isTelegramBotConfigured(): boolean {
  return getTelegramBotUsername().length > 0
}
