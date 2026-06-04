import { GrammyError } from 'grammy'
import type { Bot } from 'grammy'
import type { ReminderRepository } from '../../infrastructure/supabase/repositories/reminder.repository.js'
import type { NotificationPreferencesRepository } from '../../infrastructure/supabase/repositories/notification-preferences.repository.js'
import type { NotificationLogRepository } from '../../infrastructure/supabase/repositories/notification-log.repository.js'
import type { TelegramUserRepository } from '../../infrastructure/supabase/repositories/telegram-user.repository.js'
import type { AppLogger } from '../../infrastructure/logger.js'
import { escapeMarkdown } from '../../shared/telegram/markdown.js'
import { isWithinQuietHours, nextRunOf } from '../../shared/time/timezone.js'

export class ReminderDispatchService {
  constructor(
    private readonly bot: Bot,
    private readonly reminders: ReminderRepository,
    private readonly prefs: NotificationPreferencesRepository,
    private readonly logs: NotificationLogRepository,
    private readonly telegramUsers: TelegramUserRepository,
    private readonly log: AppLogger,
  ) {}

  /** Обработать одно due-напоминание: проверки → отправка → лог → next_run_at. */
  async dispatch(reminderId: string): Promise<void> {
    const reminder = await this.reminders.findByIdGlobal(reminderId)
    if (!reminder || !reminder.enabled) return

    const linked = await this.telegramUsers.findByUserId(reminder.userId)
    const now = new Date()

    const basePayload = {
      reminderId: reminder.id,
      title: reminder.title,
      kind: reminder.kind,
    }

    if (!linked) {
      await this.logs.insert({
        userId: reminder.userId,
        reminderId: reminder.id,
        kind: 'reminder',
        status: 'skipped_disabled',
        payload: { ...basePayload, reason: 'no_telegram_link' },
      })
      await this.advanceSchedule(reminder.id, reminder.cron, reminder.timezone, now)
      return
    }

    if (linked.isBlocked) {
      await this.logs.insert({
        userId: reminder.userId,
        reminderId: reminder.id,
        kind: 'reminder',
        status: 'skipped_blocked',
        payload: basePayload,
      })
      await this.advanceSchedule(reminder.id, reminder.cron, reminder.timezone, now)
      return
    }

    const preferences = await this.prefs.getByUserId(reminder.userId)
    if (!this.prefs.isKindEnabled(preferences, reminder.kind)) {
      await this.logs.insert({
        userId: reminder.userId,
        reminderId: reminder.id,
        kind: 'reminder',
        status: 'skipped_disabled',
        payload: { ...basePayload, reason: 'prefs_disabled' },
      })
      await this.advanceSchedule(reminder.id, reminder.cron, reminder.timezone, now)
      return
    }

    if (
      isWithinQuietHours({
        timezone: linked.timezone,
        quietStart: linked.quietHoursStart,
        quietEnd: linked.quietHoursEnd,
        now,
      })
    ) {
      await this.logs.insert({
        userId: reminder.userId,
        reminderId: reminder.id,
        kind: 'reminder',
        status: 'skipped_quiet_hours',
        payload: basePayload,
      })
      await this.advanceSchedule(reminder.id, reminder.cron, reminder.timezone, now)
      return
    }

    const text = this.formatMessage(reminder.title, reminder.message)

    try {
      await this.bot.api.sendMessage(linked.telegramChatId, text, { parse_mode: 'Markdown' })
      await this.logs.insert({
        userId: reminder.userId,
        reminderId: reminder.id,
        kind: 'reminder',
        status: 'sent',
        payload: basePayload,
      })
    } catch (err) {
      if (err instanceof GrammyError && err.error_code === 403) {
        await this.telegramUsers.markBlocked(reminder.userId, true)
        await this.logs.insert({
          userId: reminder.userId,
          reminderId: reminder.id,
          kind: 'reminder',
          status: 'skipped_blocked',
          payload: basePayload,
          error: err.description,
        })
      } else {
        const message = err instanceof Error ? err.message : String(err)
        this.log.error({ err, reminderId }, 'reminder-dispatch: send failed')
        await this.logs.insert({
          userId: reminder.userId,
          reminderId: reminder.id,
          kind: 'reminder',
          status: 'failed',
          payload: basePayload,
          error: message,
        })
      }
    }

    await this.advanceSchedule(reminder.id, reminder.cron, reminder.timezone, now)
  }

  /** Опрос БД и отправка всех просроченных напоминаний. */
  async processDueReminders(): Promise<number> {
    const backfilled = await this.reminders.backfillMissingNextRun()
    if (backfilled > 0) {
      this.log.info({ backfilled }, 'reminder-scheduler: backfilled next_run_at')
    }

    const due = await this.reminders.listDue(new Date())
    for (const item of due) {
      await this.dispatch(item.id)
    }
    return due.length
  }

  private async advanceSchedule(
    reminderId: string,
    cron: string,
    timezone: string,
    after: Date,
  ): Promise<void> {
    const next = nextRunOf(cron, timezone, after)
    await this.reminders.markRun(reminderId, after, next)
  }

  private formatMessage(title: string, message: string | null): string {
    const safeTitle = escapeMarkdown(title)
    if (message?.trim()) {
      const safeBody = escapeMarkdown(message.trim())
      return `⏰ *${safeTitle}*\n\n${safeBody}`
    }
    return `⏰ *${safeTitle}*`
  }
}
