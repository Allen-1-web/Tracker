export const REMINDER_QUEUE = 'reminders'

export const REMINDER_JOB_SCHEDULER_TICK = 'scheduler-tick' as const
export const REMINDER_JOB_DISPATCH = 'dispatch-reminder' as const

/** Интервал опроса due-напоминаний в БД. */
export const SCHEDULER_TICK_MS = 60_000
