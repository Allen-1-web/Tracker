import type { Bot } from 'grammy'
import type { ReminderRepository } from '../../infrastructure/supabase/repositories/reminder.repository.js'
import type { NotificationPreferencesRepository } from '../../infrastructure/supabase/repositories/notification-preferences.repository.js'
import type { NotificationLogRepository } from '../../infrastructure/supabase/repositories/notification-log.repository.js'
import type { TelegramUserRepository } from '../../infrastructure/supabase/repositories/telegram-user.repository.js'
import type { AppLogger } from '../../infrastructure/logger.js'
import { ReminderDispatchService } from './reminder-dispatch.service.js'

/** Фабрика dispatch-сервиса с привязанным grammY Bot (для worker). */
export class ReminderDispatchFactory {
  constructor(
    private readonly reminders: ReminderRepository,
    private readonly prefs: NotificationPreferencesRepository,
    private readonly logs: NotificationLogRepository,
    private readonly telegramUsers: TelegramUserRepository,
    private readonly log: AppLogger,
  ) {}

  forBot(bot: Bot): ReminderDispatchService {
    return new ReminderDispatchService(
      bot,
      this.reminders,
      this.prefs,
      this.logs,
      this.telegramUsers,
      this.log,
    )
  }
}

export { ReminderDispatchService }
