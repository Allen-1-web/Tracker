export type ReminderKind =
  | 'habit'
  | 'goal'
  | 'nutrition'
  | 'water'
  | 'sleep'
  | 'workout'
  | 'custom'

export interface ReminderSchedule {
  id: string
  userId: string
  kind: ReminderKind
  refId: string | null
  title: string
  message: string | null
  cron: string
  timezone: string
  enabled: boolean
  nextRunAt: Date | null
  lastRunAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NewReminder {
  userId: string
  kind: ReminderKind
  refId?: string | null
  title: string
  message?: string | null
  cron: string
  timezone: string
  enabled?: boolean
}
