import { loadConfig, type AppConfig } from '../infrastructure/config.js'
import { getLogger, type AppLogger } from '../infrastructure/logger.js'
import { getSupabaseAdmin } from '../infrastructure/supabase/client.js'
import { TelegramUserRepository } from '../infrastructure/supabase/repositories/telegram-user.repository.js'
import { LinkTokenRepository } from '../infrastructure/supabase/repositories/link-token.repository.js'
import { HabitRepository } from '../infrastructure/supabase/repositories/habit.repository.js'
import { GoalRepository } from '../infrastructure/supabase/repositories/goal.repository.js'
import { NutritionRepository } from '../infrastructure/supabase/repositories/nutrition.repository.js'
import { ReminderRepository } from '../infrastructure/supabase/repositories/reminder.repository.js'
import { NotificationPreferencesRepository } from '../infrastructure/supabase/repositories/notification-preferences.repository.js'
import { NotificationLogRepository } from '../infrastructure/supabase/repositories/notification-log.repository.js'
import { AccountLinkService } from '../application/services/account-link.service.js'
import { HabitService } from '../application/services/habit.service.js'
import { GoalService } from '../application/services/goal.service.js'
import { NutritionService } from '../application/services/nutrition.service.js'
import { ReportService } from '../application/services/report.service.js'
import { ReminderService } from '../application/services/reminder.service.js'
import { ReminderDispatchFactory } from '../application/services/reminder-dispatch.factory.js'
import { DigestDispatchFactory } from '../application/services/digest-dispatch.factory.js'

export interface Container {
  config: AppConfig
  log: AppLogger
  services: {
    accountLink: AccountLinkService
    habits: HabitService
    goals: GoalService
    nutrition: NutritionService
    report: ReportService
    reminders: ReminderService
    reminderDispatch: ReminderDispatchFactory
    digestDispatch: DigestDispatchFactory
  }
  repositories: {
    telegramUsers: TelegramUserRepository
    linkTokens: LinkTokenRepository
    habits: HabitRepository
    goals: GoalRepository
    nutrition: NutritionRepository
    reminders: ReminderRepository
    notificationPrefs: NotificationPreferencesRepository
    notificationLogs: NotificationLogRepository
  }
}

let cached: Container | null = null

/** Composition root — выдаёт singleton со всеми зависимостями. */
export function buildContainer(): Container {
  if (cached) return cached

  const config = loadConfig()
  const log = getLogger()
  const db = getSupabaseAdmin()

  const telegramUsers = new TelegramUserRepository(db)
  const linkTokens = new LinkTokenRepository(db)
  const habits = new HabitRepository(db)
  const goals = new GoalRepository(db)
  const nutrition = new NutritionRepository(db)
  const reminders = new ReminderRepository(db)
  const notificationPrefs = new NotificationPreferencesRepository(db)
  const notificationLogs = new NotificationLogRepository(db)

  const accountLink = new AccountLinkService(
    telegramUsers,
    linkTokens,
    { timezone: config.defaults.timezone },
    log,
  )

  const habitService = new HabitService(habits)
  const goalService = new GoalService(goals)
  const nutritionService = new NutritionService(nutrition)
  const reportService = new ReportService(habitService, goalService, nutritionService)
  const reminderService = new ReminderService(reminders)
  const reminderDispatch = new ReminderDispatchFactory(
    reminders,
    notificationPrefs,
    notificationLogs,
    telegramUsers,
    log,
  )
  const digestDispatch = new DigestDispatchFactory(
    telegramUsers,
    notificationPrefs,
    notificationLogs,
    reportService,
    habitService,
    log,
  )

  cached = {
    config,
    log,
    repositories: {
      telegramUsers,
      linkTokens,
      habits,
      goals,
      nutrition,
      reminders,
      notificationPrefs,
      notificationLogs,
    },
    services: {
      accountLink,
      habits: habitService,
      goals: goalService,
      nutrition: nutritionService,
      report: reportService,
      reminders: reminderService,
      reminderDispatch,
      digestDispatch,
    },
  }
  return cached
}

/** Сброс кеша (для тестов). */
export function resetContainerForTests(): void {
  cached = null
}
