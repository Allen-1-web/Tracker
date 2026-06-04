import type { AdminClient } from '../client.js'
import type { Database } from '../../../domain/database.types.js'
import type { NotificationPreferences } from '../../../domain/notification.js'
import type { ReminderKind } from '../../../domain/reminder.js'
import { BotError } from '../../../domain/errors.js'

type Row = Database['public']['Tables']['notification_preferences']['Row']

function toDomain(row: Row): NotificationPreferences {
  return {
    userId: row.user_id,
    dailySummary: row.daily_summary,
    dailySummaryTime: row.daily_summary_time,
    weeklyReport: row.weekly_report,
    weeklyReportDow: row.weekly_report_dow,
    weeklyReportTime: row.weekly_report_time,
    hydration: row.hydration,
    hydrationIntervalMinutes: row.hydration_interval_minutes,
    hydrationStartTime: row.hydration_start_time,
    hydrationEndTime: row.hydration_end_time,
    nutritionReminders: row.nutrition_reminders,
    habitReminders: row.habit_reminders,
    goalDeadlineReminders: row.goal_deadline_reminders,
    missedHabitAlerts: row.missed_habit_alerts,
    updatedAt: new Date(row.updated_at),
  }
}

export class NotificationPreferencesRepository {
  constructor(private readonly db: AdminClient) {}

  async getByUserId(userId: string): Promise<NotificationPreferences> {
    await this.db.rpc('ensure_notification_prefs', { p_user_id: userId })

    const { data, error } = await this.db
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !data) {
      throw new BotError('internal', error?.message ?? 'prefs not found', { cause: error })
    }
    return toDomain(data)
  }

  /** Проверка глобального тоггла для kind напоминания. */
  isKindEnabled(prefs: NotificationPreferences, kind: ReminderKind): boolean {
    switch (kind) {
      case 'habit':
        return prefs.habitReminders
      case 'goal':
        return prefs.goalDeadlineReminders
      case 'nutrition':
        return prefs.nutritionReminders
      case 'water':
        return prefs.hydration
      case 'sleep':
      case 'workout':
      case 'custom':
        return true
      default:
        return true
    }
  }
}
