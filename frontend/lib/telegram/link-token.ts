import { randomBytes } from 'node:crypto'
import { getTelegramBotUsername } from './env'

/** Сколько минут действует deep-link до использования */
export const LINK_TOKEN_TTL_MINUTES = 10

/**
 * Генерация одноразового токена для deep-link.
 *
 * 32 байта случайных данных → base64url ≈ 43 символа.
 * Telegram /start payload поддерживает [A-Za-z0-9_-]{1,64} — попадаем.
 */
export function generateLinkToken(): string {
  return randomBytes(32).toString('base64url')
}

export function linkTokenExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + LINK_TOKEN_TTL_MINUTES * 60_000)
}

/** Построение deep-link `https://t.me/<bot>?start=<token>`. */
export function buildDeepLink(token: string, botUsername?: string): string {
  const username = botUsername ?? getTelegramBotUsername()
  if (!username) {
    throw new Error(
      'TELEGRAM_BOT_USERNAME не задан. Установите его в frontend/.env.local.',
    )
  }
  return `https://t.me/${username}?start=${encodeURIComponent(token)}`
}
