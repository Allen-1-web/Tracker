import { parseISO } from 'date-fns'
import type { Database } from '@/lib/supabase/database.types'
import type { NotificationPreferences, ReminderSchedule } from '@/lib/types'
import { formatTimeOfDay } from './time'

type PrefsRow = Database['public']['Tables']['notification_preferences']['Row']
type ReminderRow = Database['public']['Tables']['reminder_schedules']['Row']

export function mapNotificationPreferences(row: PrefsRow): NotificationPreferences {
  return {
    userId: row.user_id,
    dailySummary: row.daily_summary,
    dailySummaryTime: formatTimeOfDay(row.daily_summary_time),
    weeklyReport: row.weekly_report,
    weeklyReportDow: row.weekly_report_dow,
    weeklyReportTime: formatTimeOfDay(row.weekly_report_time),
    hydration: row.hydration,
    hydrationIntervalMinutes: row.hydration_interval_minutes,
    hydrationStartTime: formatTimeOfDay(row.hydration_start_time),
    hydrationEndTime: formatTimeOfDay(row.hydration_end_time),
    nutritionReminders: row.nutrition_reminders,
    habitReminders: row.habit_reminders,
    goalDeadlineReminders: row.goal_deadline_reminders,
    missedHabitAlerts: row.missed_habit_alerts,
    updatedAt: parseISO(row.updated_at),
  }
}

export function mapReminderSchedule(row: ReminderRow): ReminderSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    refId: row.ref_id,
    title: row.title,
    message: row.message,
    cron: row.cron,
    timezone: row.timezone,
    enabled: row.enabled,
    nextRunAt: row.next_run_at ? parseISO(row.next_run_at) : null,
    lastRunAt: row.last_run_at ? parseISO(row.last_run_at) : null,
    createdAt: parseISO(row.created_at),
    updatedAt: parseISO(row.updated_at),
  }
}
