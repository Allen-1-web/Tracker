import type { AppLogger } from '../../infrastructure/logger.js'
import type { ContactInfo, LinkedUser } from '../../domain/user.js'
import { BotError } from '../../domain/errors.js'
import type { TelegramUserRepository } from '../../infrastructure/supabase/repositories/telegram-user.repository.js'
import type { LinkTokenRepository } from '../../infrastructure/supabase/repositories/link-token.repository.js'

export interface LinkAccountInput {
  token: string
  contact: ContactInfo
}

export interface LinkAccountResult {
  linkedUser: LinkedUser
  /** Был ли это первый раз для пары (user, chat) */
  isFirstLink: boolean
}

export class AccountLinkService {
  constructor(
    private readonly telegramUsers: TelegramUserRepository,
    private readonly tokens: LinkTokenRepository,
    private readonly defaults: { timezone: string },
    private readonly log: AppLogger,
  ) {}

  /** Полный сценарий /start <token>. */
  async linkAccount(input: LinkAccountInput): Promise<LinkAccountResult> {
    const { token, contact } = input

    const tokenRecord = await this.tokens.consume(token)

    const existing = await this.telegramUsers.findByUserId(tokenRecord.userId)
    const isFirstLink = existing == null

    const linkedUser = await this.telegramUsers.upsertLink({
      userId: tokenRecord.userId,
      contact,
      defaultTimezone: existing?.timezone ?? this.defaults.timezone,
    })

    this.log.info(
      { userId: linkedUser.userId, chatId: linkedUser.telegramChatId, isFirstLink },
      'account: linked',
    )

    return { linkedUser, isFirstLink }
  }

  /** /unlink: пользователь сам отвязал из бота. */
  async unlinkByChatId(chatId: number): Promise<{ userId: string }> {
    const linked = await this.telegramUsers.findByChatId(chatId)
    if (!linked) {
      throw new BotError('account_not_linked', 'Этот чат пока не привязан к аккаунту.')
    }
    const removed = await this.telegramUsers.deleteByUserId(linked.userId)
    if (!removed) {
      throw new BotError('internal', 'Не удалось отвязать аккаунт')
    }
    this.log.info({ userId: linked.userId, chatId }, 'account: unlinked')
    return { userId: linked.userId }
  }

  async getByChatId(chatId: number): Promise<LinkedUser | null> {
    return this.telegramUsers.findByChatId(chatId)
  }
}
