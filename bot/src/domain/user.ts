/** Доменное представление связки Telegram ↔ user. */
export interface LinkedUser {
  userId: string
  telegramChatId: number
  telegramUserId: number
  username: string | null
  firstName: string | null
  lastName: string | null
  languageCode: string | null
  timezone: string
  quietHoursStart: string | null
  quietHoursEnd: string | null
  isBlocked: boolean
  linkedAt: Date
  lastSeenAt: Date | null
}

export interface ContactInfo {
  telegramUserId: number
  telegramChatId: number
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  languageCode?: string | null
}
