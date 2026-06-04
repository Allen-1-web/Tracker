import { z } from 'zod'

// Supabase возвращает `timestamptz` со смещением (`+00:00`), а не `Z`,
// поэтому разрешаем оба варианта (offset допускает и `Z`).
const isoDateTime = z.string().datetime({ offset: true })

/** Ответ на `POST /api/telegram/link` */
export const linkResponseSchema = z.object({
  token: z.string().min(16).max(128),
  deepLink: z.string().url(),
  expiresAt: isoDateTime,
  botUsername: z.string().min(1),
})

export type LinkResponse = z.infer<typeof linkResponseSchema>

/** Ответ на `GET /api/telegram/status` */
export const telegramStatusSchema = z.object({
  connected: z.boolean(),
  username: z.string().nullable(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  timezone: z.string().nullable(),
  linkedAt: isoDateTime.nullable(),
  lastSeenAt: isoDateTime.nullable(),
})

export type TelegramStatus = z.infer<typeof telegramStatusSchema>
