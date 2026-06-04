import type { Bot } from 'grammy'
import type { NotificationLogRepository } from '../../infrastructure/supabase/repositories/notification-log.repository.js'
import type { NotificationPreferencesRepository } from '../../infrastructure/supabase/repositories/notification-preferences.repository.js'
import type { TelegramUserRepository } from '../../infrastructure/supabase/repositories/telegram-user.repository.js'
import type { ReportService } from './report.service.js'
import type { HabitService } from './habit.service.js'
import type { AppLogger } from '../../infrastructure/logger.js'
import { DigestNotificationService } from './digest-notification.service.js'

export class DigestDispatchFactory {
  constructor(
    private readonly telegramUsers: TelegramUserRepository,
    private readonly prefs: NotificationPreferencesRepository,
    private readonly logs: NotificationLogRepository,
    private readonly report: ReportService,
    private readonly habits: HabitService,
    private readonly log: AppLogger,
  ) {}

  forBot(bot: Bot): DigestNotificationService {
    return new DigestNotificationService(
      bot,
      this.telegramUsers,
      this.prefs,
      this.logs,
      this.report,
      this.habits,
      this.log,
    )
  }
}

export { DigestNotificationService }
