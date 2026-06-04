import { GrammyError } from 'grammy'
import type { Bot } from 'grammy'
import type { LinkedUser } from '../../domain/user.js'
import type { NotificationPreferences } from '../../domain/notification.js'
import type { NotificationLogRepository } from '../../infrastructure/supabase/repositories/notification-log.repository.js'
import type { NotificationPreferencesRepository } from '../../infrastructure/supabase/repositories/notification-preferences.repository.js'
import type { TelegramUserRepository } from '../../infrastructure/supabase/repositories/telegram-user.repository.js'
import type { ReportService } from './report.service.js'
import type { HabitService } from './habit.service.js'
import type { AppLogger } from '../../infrastructure/logger.js'
import {
  dayOfWeekInZone,
  isPastScheduledTimeToday,
  isWithinMinuteWindow,
  isWithinQuietHours,
  minutesOfDayInZone,
  parseTimeOfDay,
  scheduledTimeToday,
} from '../../shared/time/timezone.js'
import {
  formatDailySummaryMessage,
  formatHydrationMessage,
  formatMissedHabitsMessage,
  formatWeeklySummaryMessage,
} from '../../presentation/markup/digest-messages.js'

export class DigestNotificationService {
  constructor(
    private readonly bot: Bot,
    private readonly telegramUsers: TelegramUserRepository,
    private readonly prefs: NotificationPreferencesRepository,
    private readonly logs: NotificationLogRepository,
    private readonly report: ReportService,
    private readonly habits: HabitService,
    private readonly log: AppLogger,
  ) {}

  async processAutomatedNotifications(): Promise<number> {
    const users = await this.telegramUsers.listActive()
    let sent = 0
    const now = new Date()

    for (const linked of users) {
      try {
        sent += await this.processUser(linked, now)
      } catch (err) {
        this.log.error({ err, userId: linked.userId }, 'digest: user processing failed')
      }
    }

    return sent
  }

  private async processUser(linked: LinkedUser, now: Date): Promise<number> {
    if (
      isWithinQuietHours({
        timezone: linked.timezone,
        quietStart: linked.quietHoursStart,
        quietEnd: linked.quietHoursEnd,
        now,
      })
    ) {
      return 0
    }

    const preferences = await this.prefs.getByUserId(linked.userId)
    let sent = 0

    if (
      preferences.dailySummary &&
      isPastScheduledTimeToday(now, linked.timezone, preferences.dailySummaryTime)
    ) {
      sent += await this.sendDailySummary(linked, now, preferences.dailySummaryTime)
    }

    if (
      preferences.weeklyReport &&
      dayOfWeekInZone(now, linked.timezone) === preferences.weeklyReportDow &&
      isPastScheduledTimeToday(now, linked.timezone, preferences.weeklyReportTime)
    ) {
      sent += await this.sendWeeklyReport(linked, now, preferences.weeklyReportTime)
    }

    if (
      preferences.missedHabitAlerts &&
      isPastScheduledTimeToday(now, linked.timezone, preferences.dailySummaryTime)
    ) {
      sent += await this.sendMissedHabits(linked, now, preferences.dailySummaryTime)
    }

    if (preferences.hydration) {
      sent += await this.sendHydrationIfDue(linked, preferences, now)
    }

    return sent
  }

  private async sendDailySummary(linked: LinkedUser, now: Date, timeOfDay: string): Promise<number> {
    const since = scheduledTimeToday(now, linked.timezone, timeOfDay)
    if (!since) return 0
    if (await this.logs.hasSentSince(linked.userId, 'daily_summary', since)) return 0

    const report = await this.report.buildDaily(linked.userId, linked.timezone)
    return (await this.deliver(linked, 'daily_summary', formatDailySummaryMessage(report))) ? 1 : 0
  }

  private async sendWeeklyReport(linked: LinkedUser, now: Date, timeOfDay: string): Promise<number> {
    const since = scheduledTimeToday(now, linked.timezone, timeOfDay)
    if (!since) return 0
    if (await this.logs.hasSentSince(linked.userId, 'weekly_report', since)) return 0

    const report = await this.report.buildDaily(linked.userId, linked.timezone)
    return (await this.deliver(linked, 'weekly_report', formatWeeklySummaryMessage(report))) ? 1 : 0
  }

  private async sendMissedHabits(linked: LinkedUser, now: Date, timeOfDay: string): Promise<number> {
    const since = scheduledTimeToday(now, linked.timezone, timeOfDay)
    if (!since) return 0
    if (await this.logs.hasSentSince(linked.userId, 'missed_habit', since)) return 0

    const { date, items } = await this.habits.listToday(linked.userId, linked.timezone)
    const missed = items.filter((i) => !i.completed).map((i) => `${i.habit.icon} ${i.habit.name}`)
    if (missed.length === 0) return 0

    return (await this.deliver(linked, 'missed_habit', formatMissedHabitsMessage(date, missed))) ? 1 : 0
  }

  private async sendHydrationIfDue(
    linked: LinkedUser,
    preferences: NotificationPreferences,
    now: Date,
  ): Promise<number> {
    const nowMinutes = minutesOfDayInZone(now, linked.timezone)
    const start = parseTimeOfDay(preferences.hydrationStartTime)
    const end = parseTimeOfDay(preferences.hydrationEndTime)
    if (nowMinutes == null || !start || !end) return 0

    const startMin = start.hour * 60 + start.minute
    const endMin = end.hour * 60 + end.minute
    if (!isWithinMinuteWindow(nowMinutes, startMin, endMin)) return 0

    const lastSent = await this.logs.getLastSentAt(linked.userId, 'hydration')
    const intervalMs = preferences.hydrationIntervalMinutes * 60_000
    if (lastSent && now.getTime() - lastSent.getTime() < intervalMs) return 0

    return (await this.deliver(linked, 'hydration', formatHydrationMessage())) ? 1 : 0
  }

  private async deliver(linked: LinkedUser, kind: string, text: string): Promise<boolean> {
    try {
      await this.bot.api.sendMessage(linked.telegramChatId, text, { parse_mode: 'Markdown' })
      await this.logs.insert({ userId: linked.userId, kind, status: 'sent' })
      return true
    } catch (err) {
      if (err instanceof GrammyError && err.error_code === 403) {
        await this.telegramUsers.markBlocked(linked.userId, true)
        await this.logs.insert({
          userId: linked.userId,
          kind,
          status: 'skipped_blocked',
          error: err.description,
        })
      } else {
        const message = err instanceof Error ? err.message : String(err)
        this.log.error({ err, userId: linked.userId, kind }, 'digest: send failed')
        await this.logs.insert({
          userId: linked.userId,
          kind,
          status: 'failed',
          error: message,
        })
      }
      return false
    }
  }
}
