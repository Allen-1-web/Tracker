/**
 * Шаг 7. Negative-тесты flow привязки Telegram.
 *
 * Прогоняем 5 сценариев из чек-листа без обращения к реальному Telegram/Supabase:
 *
 *   1) `/start abc`        — мусорный payload
 *   2) /start <used>       — токен уже использован
 *   3) /start <expired>    — токен просрочен
 *   4) /start <token>      — тот же user_id, новый chat_id (смена устройства)
 *   5) /start <other-user> — токен другого user'а в чат, занятый другим
 *
 * Сценарии 2-5 проверяются на уровне AccountLinkService с in-memory репозиториями,
 * которые точно повторяют контракты LinkTokenRepository / TelegramUserRepository
 * (см. infrastructure/supabase/repositories).
 *
 * Сценарий 1 проверяется через parseStartPayload + assertParseableStartPayload
 * (та же логика, что в presentation/commands/start.ts).
 */

import { describe, it, expect, beforeEach } from 'vitest'

import { AccountLinkService } from '../src/application/services/account-link.service.js'
import { BotError, isBotError } from '../src/domain/errors.js'
import type { ContactInfo, LinkedUser } from '../src/domain/user.js'
import { parseStartPayload, assertParseableStartPayload } from '../src/shared/validation/start-payload.js'
import type {
  LinkTokenRecord,
  LinkTokenRepository,
} from '../src/infrastructure/supabase/repositories/link-token.repository.js'
import type { TelegramUserRepository } from '../src/infrastructure/supabase/repositories/telegram-user.repository.js'

// ─── In-memory fakes ─────────────────────────────────────────────────────────

/** Логика 1:1 совпадает с реальным LinkTokenRepository.consume. */
class InMemoryLinkTokenRepo implements Pick<LinkTokenRepository, 'consume' | 'find' | 'cleanupExpired'> {
  readonly tokens = new Map<string, LinkTokenRecord>()

  seed(token: string, userId: string, opts: { expiresInMs?: number; usedAt?: Date } = {}): void {
    const now = Date.now()
    this.tokens.set(token, {
      token,
      userId,
      expiresAt: new Date(now + (opts.expiresInMs ?? 10 * 60_000)),
      usedAt: opts.usedAt ?? null,
      createdAt: new Date(now),
    })
  }

  async find(token: string): Promise<LinkTokenRecord | null> {
    return this.tokens.get(token) ?? null
  }

  async consume(token: string): Promise<LinkTokenRecord> {
    const record = this.tokens.get(token)
    if (!record) {
      throw new BotError('invalid_link_token', 'Ссылка недействительна')
    }
    if (record.usedAt) {
      throw new BotError('link_token_used', 'Эта ссылка уже использована')
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new BotError(
        'link_token_expired',
        'Ссылка истекла. Сгенерируйте новую в «Настройках».',
      )
    }
    const usedAt = new Date()
    const updated: LinkTokenRecord = { ...record, usedAt }
    this.tokens.set(token, updated)
    return updated
  }

  async cleanupExpired(): Promise<number> {
    return 0
  }
}

/** Логика 1:1 совпадает с реальным TelegramUserRepository.upsertLink. */
class InMemoryTelegramUserRepo
  implements
    Pick<
      TelegramUserRepository,
      'findByChatId' | 'findByUserId' | 'upsertLink' | 'deleteByUserId' | 'touchLastSeen' | 'markBlocked'
    >
{
  readonly byUserId = new Map<string, LinkedUser>()
  readonly chatToUser = new Map<number, string>()

  async findByChatId(chatId: number): Promise<LinkedUser | null> {
    const userId = this.chatToUser.get(chatId)
    return userId ? this.byUserId.get(userId) ?? null : null
  }

  async findByUserId(userId: string): Promise<LinkedUser | null> {
    return this.byUserId.get(userId) ?? null
  }

  async upsertLink(args: {
    userId: string
    contact: ContactInfo
    defaultTimezone: string
  }): Promise<LinkedUser> {
    const { userId, contact, defaultTimezone } = args

    const conflict = await this.findByChatId(contact.telegramChatId)
    if (conflict && conflict.userId !== userId) {
      throw new BotError(
        'chat_already_linked',
        'Этот Telegram-аккаунт уже привязан к другому пользователю. ' +
          'Откройте «Настройки» в том аккаунте и отвяжите Telegram, либо войдите в правильный аккаунт.',
      )
    }

    // Если у user'а уже был другой chat, переучиваем mapping.
    const existing = this.byUserId.get(userId)
    if (existing && existing.telegramChatId !== contact.telegramChatId) {
      this.chatToUser.delete(existing.telegramChatId)
    }

    const linked: LinkedUser = {
      userId,
      telegramChatId: contact.telegramChatId,
      telegramUserId: contact.telegramUserId,
      username: contact.username ?? null,
      firstName: contact.firstName ?? null,
      lastName: contact.lastName ?? null,
      languageCode: contact.languageCode ?? null,
      timezone: existing?.timezone ?? defaultTimezone,
      quietHoursStart: existing?.quietHoursStart ?? null,
      quietHoursEnd: existing?.quietHoursEnd ?? null,
      isBlocked: false,
      linkedAt: existing?.linkedAt ?? new Date(),
      lastSeenAt: new Date(),
    }
    this.byUserId.set(userId, linked)
    this.chatToUser.set(contact.telegramChatId, userId)
    return linked
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const existing = this.byUserId.get(userId)
    if (!existing) return false
    this.byUserId.delete(userId)
    this.chatToUser.delete(existing.telegramChatId)
    return true
  }

  async touchLastSeen(): Promise<void> {}
  async markBlocked(): Promise<void> {}
}

// ─── Test fixtures ───────────────────────────────────────────────────────────

const silentLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  trace: () => undefined,
  fatal: () => undefined,
  child: () => silentLogger,
  level: 'silent',
} as unknown as Parameters<typeof AccountLinkService.prototype.constructor>[3]

const USER_A = '11111111-1111-1111-1111-111111111111'
const USER_B = '22222222-2222-2222-2222-222222222222'

const CHAT_A1 = 1001
const CHAT_A2 = 1002 // тот же пользователь, второе устройство
const CHAT_B = 2001

function contact(chatId: number, tgUserId: number, name = 'Test'): ContactInfo {
  return {
    telegramChatId: chatId,
    telegramUserId: tgUserId,
    username: 'tester',
    firstName: name,
    lastName: null,
    languageCode: 'ru',
  }
}

/** «Хороший» по форме токен (43 base64url символа). */
function freshToken(seed: string): string {
  return (seed + 'A'.repeat(64)).slice(0, 43).replace(/[^A-Za-z0-9_-]/g, 'A')
}

let tokens: InMemoryLinkTokenRepo
let users: InMemoryTelegramUserRepo
let service: AccountLinkService

beforeEach(() => {
  tokens = new InMemoryLinkTokenRepo()
  users = new InMemoryTelegramUserRepo()
  service = new AccountLinkService(
    users as unknown as TelegramUserRepository,
    tokens as unknown as LinkTokenRepository,
    { timezone: 'Europe/Moscow' },
    silentLogger,
  )
})

// ─── Scenario 1: garbage payload ─────────────────────────────────────────────

describe('Шаг 7 / сценарий 1: мусорный payload', () => {
  it('parseStartPayload отсеивает короткие/мусорные значения', () => {
    expect(parseStartPayload('abc')).toBeNull()
    expect(parseStartPayload('')).toBeNull()
    expect(parseStartPayload(undefined)).toBeNull()
    expect(parseStartPayload('!!!@@@###')).toBeNull()
    expect(parseStartPayload('a'.repeat(15))).toBeNull() // < 16 символов
    expect(parseStartPayload('a'.repeat(65))).toBeNull() // > 64 символов
  })

  it('/start abc → invalid_link_token (до welcome-ветки)', () => {
    const payload = 'abc'
    const token = parseStartPayload(payload)
    expect(token).toBeNull()
    expect(() => assertParseableStartPayload(payload, token)).toThrow(
      expect.objectContaining({ code: 'invalid_link_token' }),
    )
  })

  it('/start без payload → welcome, не ошибка', () => {
    const payload = ''
    const token = parseStartPayload(payload)
    expect(token).toBeNull()
    expect(() => assertParseableStartPayload(payload, token)).not.toThrow()
  })

  it('даже если такой токен «случайно» дошёл бы до сервиса — будет invalid_link_token', async () => {
    // Если payload прошёл бы парсер, но в БД его нет — consume бросает invalid_link_token.
    await expect(service.linkAccount({ token: 'abc', contact: contact(CHAT_A1, 42) })).rejects.toSatisfy(
      (e: unknown) =>
        isBotError(e) && e.code === 'invalid_link_token',
    )
  })
})

// ─── Scenario 2: token already used ──────────────────────────────────────────

describe('Шаг 7 / сценарий 2: повторное использование токена', () => {
  it('первый /start привязывает, второй с тем же токеном падает с link_token_used', async () => {
    const token = freshToken('used')
    tokens.seed(token, USER_A)

    await service.linkAccount({ token, contact: contact(CHAT_A1, 42) })

    await expect(
      service.linkAccount({ token, contact: contact(CHAT_A2, 43) }),
    ).rejects.toSatisfy((e: unknown) => isBotError(e) && e.code === 'link_token_used')
  })
})

// ─── Scenario 3: token expired ───────────────────────────────────────────────

describe('Шаг 7 / сценарий 3: просроченный токен', () => {
  it('expires_at в прошлом → link_token_expired', async () => {
    const token = freshToken('expired')
    tokens.seed(token, USER_A, { expiresInMs: -1 }) // уже истёк
    await expect(
      service.linkAccount({ token, contact: contact(CHAT_A1, 42) }),
    ).rejects.toSatisfy((e: unknown) => isBotError(e) && e.code === 'link_token_expired')
  })
})

// ─── Scenario 4: relink from another device (same user) ──────────────────────

describe('Шаг 7 / сценарий 4: смена устройства того же user-а', () => {
  it('новый chat_id для существующего user_id → upsert, isFirstLink=false', async () => {
    const firstToken = freshToken('first')
    tokens.seed(firstToken, USER_A)
    const firstResult = await service.linkAccount({
      token: firstToken,
      contact: contact(CHAT_A1, 42, 'Phone'),
    })
    expect(firstResult.isFirstLink).toBe(true)
    expect(firstResult.linkedUser.telegramChatId).toBe(CHAT_A1)

    const secondToken = freshToken('second')
    tokens.seed(secondToken, USER_A)
    const secondResult = await service.linkAccount({
      token: secondToken,
      contact: contact(CHAT_A2, 43, 'Tablet'),
    })
    expect(secondResult.isFirstLink).toBe(false)
    expect(secondResult.linkedUser.userId).toBe(USER_A)
    expect(secondResult.linkedUser.telegramChatId).toBe(CHAT_A2)

    // старый chat больше не привязан к user-у
    expect(await users.findByChatId(CHAT_A1)).toBeNull()
    // в БД одна запись на пользователя
    expect(users.byUserId.size).toBe(1)
  })
})

// ─── Scenario 5: chat already linked to another user ─────────────────────────

describe('Шаг 7 / сценарий 5: чужой токен в чат, где уже другой user', () => {
  it('chat занят user A, deep-link выдан user B → chat_already_linked', async () => {
    // Привязали user A к чату CHAT_B (предположим — это «общий» Telegram-аккаунт).
    const tokenA = freshToken('userA')
    tokens.seed(tokenA, USER_A)
    await service.linkAccount({ token: tokenA, contact: contact(CHAT_B, 99) })

    // user B сгенерировал свой токен и пытается перейти по нему ИЗ ТОГО ЖЕ чата.
    const tokenB = freshToken('userB')
    tokens.seed(tokenB, USER_B)

    await expect(
      service.linkAccount({ token: tokenB, contact: contact(CHAT_B, 99) }),
    ).rejects.toSatisfy((e: unknown) => isBotError(e) && e.code === 'chat_already_linked')
  })
})
