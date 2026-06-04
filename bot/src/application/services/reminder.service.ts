import type { ReminderRepository } from '../../infrastructure/supabase/repositories/reminder.repository.js'
import type { NewReminder, ReminderSchedule } from '../../domain/reminder.js'
import { isValidCron, localTimeToCron, parseTimeOfDay } from '../../shared/time/timezone.js'
import { BotError } from '../../domain/errors.js'

export class ReminderService {
  constructor(private readonly reminders: ReminderRepository) {}

  async listForUser(userId: string, timezone: string): Promise<ReminderSchedule[]> {
    await this.reminders.ensureFromProfile(userId, timezone)
    return this.reminders.listByUserId(userId)
  }

  async toggleEnabled(userId: string, reminderId: string): Promise<ReminderSchedule> {
    const current = await this.reminders.findById(userId, reminderId)
    if (!current) throw new BotError('not_found', 'Напоминание не найдено')
    return this.reminders.setEnabled(userId, reminderId, !current.enabled)
  }

  async addDailyCustom(
    userId: string,
    timezone: string,
    time: string,
    title: string,
    message?: string | null,
  ): Promise<ReminderSchedule> {
    const parsed = parseTimeOfDay(time)
    if (!parsed) {
      throw new BotError('validation', 'Неверное время. Используйте формат HH:MM, например 09:30.')
    }

    const cron = localTimeToCron(parsed.hour, parsed.minute)
    if (!isValidCron(cron, timezone)) {
      throw new BotError('validation', 'Не удалось построить расписание для вашей тайм-зоны.')
    }

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 1 || trimmedTitle.length > 200) {
      throw new BotError('validation', 'Заголовок должен быть от 1 до 200 символов.')
    }

    return this.reminders.create({
      userId,
      kind: 'custom',
      title: trimmedTitle,
      message: message?.trim() || null,
      cron,
      timezone,
      enabled: true,
    } satisfies NewReminder)
  }
}
