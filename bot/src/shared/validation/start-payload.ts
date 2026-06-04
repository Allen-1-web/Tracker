import { z } from 'zod'
import { BotError } from '../../domain/errors.js'

/**
 * Telegram /start payload: до 64 символов из [A-Za-z0-9_-].
 * Наш токен — base64url(32 байта) ≈ 43 символа, попадает с запасом.
 */
export const startPayloadSchema = z
  .string()
  .min(16, 'Слишком короткий код')
  .max(64, 'Слишком длинный код')
  .regex(/^[A-Za-z0-9_-]+$/, 'Недопустимые символы')

export type StartPayload = z.infer<typeof startPayloadSchema>

export function parseStartPayload(raw: string | undefined): StartPayload | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const parsed = startPayloadSchema.safeParse(trimmed)
  return parsed.success ? parsed.data : null
}

/** Payload передан в /start, но не прошёл parseStartPayload — мусорная deep-link. */
export function assertParseableStartPayload(payload: string, token: StartPayload | null): void {
  if (payload.length > 0 && token === null) {
    throw new BotError('invalid_link_token', 'Неверный формат ссылки')
  }
}
