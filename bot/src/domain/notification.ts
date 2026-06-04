export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'skipped_quiet_hours'
  | 'skipped_disabled'
  | 'skipped_blocked'

export type NotificationKind =
  | 'reminder'
  | 'daily_summary'
  | 'weekly_report'
  | 'hydration'
  | 'nutrition'
  | 'missed_habit'
  | 'goal_deadline'
  | 'system'

export interface NotificationLogEntry {
  id: string
  userId: string
  reminderId: string | null
  kind: NotificationKind | string
  channel: string
  status: NotificationStatus
  payload: unknown
  error: string | null
  attempt: number
  createdAt: Date
}

export interface NotificationPreferences {
  userId: string
  dailySummary: boolean
  dailySummaryTime: string
  weeklyReport: boolean
  weeklyReportDow: number
  weeklyReportTime: string
  hydration: boolean
  hydrationIntervalMinutes: number
  hydrationStartTime: string
  hydrationEndTime: string
  nutritionReminders: boolean
  habitReminders: boolean
  goalDeadlineReminders: boolean
  missedHabitAlerts: boolean
  updatedAt: Date
}
