import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { NotificationPreferences, ReminderSchedule } from '@/lib/types'
import { localTimeToCron, nextRunOf } from './cron'
import { mapNotificationPreferences, mapReminderSchedule } from './maps'
import { formatTimeOfDay, isValidTimezone, parseTimeOfDay } from './time'

export type AuthedClient = SupabaseClient<Database>

type PrefsUpdate = Database['public']['Tables']['notification_preferences']['Update']
type ReminderUpdate = Database['public']['Tables']['reminder_schedules']['Update']

export interface NotificationPreferencesPatch {
  dailySummary?: boolean
  dailySummaryTime?: string
  weeklyReport?: boolean
  weeklyReportDow?: number
  weeklyReportTime?: string
  hydration?: boolean
  hydrationIntervalMinutes?: number
  hydrationStartTime?: string
  hydrationEndTime?: string
  nutritionReminders?: boolean
  habitReminders?: boolean
  goalDeadlineReminders?: boolean
  missedHabitAlerts?: boolean
}

export interface ReminderCreateInput {
  title: string
  message?: string
  time: string
  timezone?: string
}

export interface ReminderPatchInput {
  enabled?: boolean
  title?: string
  message?: string | null
  time?: string
  timezone?: string
}

export interface TelegramPreferences {
  timezone: string
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

export interface TelegramPreferencesPatch {
  timezone?: string
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}

function toDbTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

function prefsPatchToDb(patch: NotificationPreferencesPatch): PrefsUpdate {
  const db: PrefsUpdate = {}
  if (patch.dailySummary !== undefined) db.daily_summary = patch.dailySummary
  if (patch.dailySummaryTime !== undefined) db.daily_summary_time = toDbTime(patch.dailySummaryTime)
  if (patch.weeklyReport !== undefined) db.weekly_report = patch.weeklyReport
  if (patch.weeklyReportDow !== undefined) db.weekly_report_dow = patch.weeklyReportDow
  if (patch.weeklyReportTime !== undefined) db.weekly_report_time = toDbTime(patch.weeklyReportTime)
  if (patch.hydration !== undefined) db.hydration = patch.hydration
  if (patch.hydrationIntervalMinutes !== undefined) {
    db.hydration_interval_minutes = patch.hydrationIntervalMinutes
  }
  if (patch.hydrationStartTime !== undefined) db.hydration_start_time = toDbTime(patch.hydrationStartTime)
  if (patch.hydrationEndTime !== undefined) db.hydration_end_time = toDbTime(patch.hydrationEndTime)
  if (patch.nutritionReminders !== undefined) db.nutrition_reminders = patch.nutritionReminders
  if (patch.habitReminders !== undefined) db.habit_reminders = patch.habitReminders
  if (patch.goalDeadlineReminders !== undefined) db.goal_deadline_reminders = patch.goalDeadlineReminders
  if (patch.missedHabitAlerts !== undefined) db.missed_habit_alerts = patch.missedHabitAlerts
  return db
}

async function ensurePrefs(supabase: AuthedClient, userId: string): Promise<void> {
  const { error } = await supabase.rpc('ensure_notification_prefs', { p_user_id: userId })
  if (error) throw error
}

export async function getDefaultTimezone(
  supabase: AuthedClient,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('telegram_users')
    .select('timezone')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (data?.timezone && isValidTimezone(data.timezone)) return data.timezone
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export async function getNotificationPreferences(
  supabase: AuthedClient,
  userId: string,
): Promise<NotificationPreferences> {
  await ensurePrefs(supabase, userId)
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return mapNotificationPreferences(data)
}

export async function updateNotificationPreferences(
  supabase: AuthedClient,
  userId: string,
  patch: NotificationPreferencesPatch,
): Promise<NotificationPreferences> {
  await ensurePrefs(supabase, userId)
  const { data, error } = await supabase
    .from('notification_preferences')
    .update(prefsPatchToDb(patch))
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw error
  return mapNotificationPreferences(data)
}

export async function listReminders(
  supabase: AuthedClient,
  userId: string,
): Promise<ReminderSchedule[]> {
  const { data, error } = await supabase
    .from('reminder_schedules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapReminderSchedule)
}

export async function createReminder(
  supabase: AuthedClient,
  userId: string,
  input: ReminderCreateInput,
): Promise<ReminderSchedule> {
  const parsed = parseTimeOfDay(input.time)
  if (!parsed) throw new Error('Некорректное время')

  const timezone = input.timezone ?? (await getDefaultTimezone(supabase, userId))
  if (!isValidTimezone(timezone)) throw new Error('Некорректный часовой пояс')

  const cron = localTimeToCron(parsed.hour, parsed.minute)
  const nextRun = nextRunOf(cron, timezone)

  const { data, error } = await supabase
    .from('reminder_schedules')
    .insert({
      user_id: userId,
      kind: 'custom',
      title: input.title,
      message: input.message?.trim() || null,
      cron,
      timezone,
      enabled: true,
      next_run_at: nextRun?.toISOString() ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapReminderSchedule(data)
}

export async function updateReminder(
  supabase: AuthedClient,
  userId: string,
  reminderId: string,
  patch: ReminderPatchInput,
): Promise<ReminderSchedule> {
  const { data: existing, error: findErr } = await supabase
    .from('reminder_schedules')
    .select('*')
    .eq('user_id', userId)
    .eq('id', reminderId)
    .maybeSingle()
  if (findErr) throw findErr
  if (!existing) throw new Error('Напоминание не найдено')

  const dbPatch: ReminderUpdate = {}
  if (patch.enabled !== undefined) dbPatch.enabled = patch.enabled
  if (patch.title !== undefined) dbPatch.title = patch.title
  if (patch.message !== undefined) dbPatch.message = patch.message

  const timezone = patch.timezone ?? existing.timezone
  if (patch.timezone !== undefined) {
    if (!isValidTimezone(timezone)) throw new Error('Некорректный часовой пояс')
    dbPatch.timezone = timezone
  }

  if (patch.time !== undefined) {
    const parsed = parseTimeOfDay(patch.time)
    if (!parsed) throw new Error('Некорректное время')
    const cron = localTimeToCron(parsed.hour, parsed.minute)
    dbPatch.cron = cron
    const nextRun = nextRunOf(cron, timezone)
    dbPatch.next_run_at = nextRun?.toISOString() ?? null
  } else if (patch.enabled === true && !existing.next_run_at) {
    const nextRun = nextRunOf(existing.cron, timezone)
    dbPatch.next_run_at = nextRun?.toISOString() ?? null
  }

  const { data, error } = await supabase
    .from('reminder_schedules')
    .update(dbPatch)
    .eq('user_id', userId)
    .eq('id', reminderId)
    .select('*')
    .single()
  if (error) throw error
  return mapReminderSchedule(data)
}

export async function deleteReminder(
  supabase: AuthedClient,
  userId: string,
  reminderId: string,
): Promise<{ removed: boolean }> {
  const { error, count } = await supabase
    .from('reminder_schedules')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('id', reminderId)
  if (error) throw error
  return { removed: (count ?? 0) > 0 }
}

export async function getTelegramPreferences(
  supabase: AuthedClient,
  userId: string,
): Promise<TelegramPreferences | null> {
  const { data, error } = await supabase
    .from('telegram_users')
    .select('timezone, quiet_hours_start, quiet_hours_end')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    timezone: data.timezone,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
  }
}

export async function updateTelegramPreferences(
  supabase: AuthedClient,
  userId: string,
  patch: TelegramPreferencesPatch,
): Promise<TelegramPreferences> {
  const dbPatch: Database['public']['Tables']['telegram_users']['Update'] = {}
  if (patch.timezone !== undefined) {
    if (!isValidTimezone(patch.timezone)) throw new Error('Некорректный часовой пояс')
    dbPatch.timezone = patch.timezone
  }
  if (patch.quietHoursStart !== undefined) {
    dbPatch.quiet_hours_start = patch.quietHoursStart ? toDbTime(patch.quietHoursStart) : null
  }
  if (patch.quietHoursEnd !== undefined) {
    dbPatch.quiet_hours_end = patch.quietHoursEnd ? toDbTime(patch.quietHoursEnd) : null
  }

  const { data, error } = await supabase
    .from('telegram_users')
    .update(dbPatch)
    .eq('user_id', userId)
    .select('timezone, quiet_hours_start, quiet_hours_end')
    .single()
  if (error) throw error

  return {
    timezone: data.timezone,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
  }
}

/** Сериализация для JSON API. */
export function serializeNotificationPreferences(prefs: NotificationPreferences) {
  return {
    userId: prefs.userId,
    dailySummary: prefs.dailySummary,
    dailySummaryTime: prefs.dailySummaryTime,
    weeklyReport: prefs.weeklyReport,
    weeklyReportDow: prefs.weeklyReportDow,
    weeklyReportTime: prefs.weeklyReportTime,
    hydration: prefs.hydration,
    hydrationIntervalMinutes: prefs.hydrationIntervalMinutes,
    hydrationStartTime: prefs.hydrationStartTime,
    hydrationEndTime: prefs.hydrationEndTime,
    nutritionReminders: prefs.nutritionReminders,
    habitReminders: prefs.habitReminders,
    goalDeadlineReminders: prefs.goalDeadlineReminders,
    missedHabitAlerts: prefs.missedHabitAlerts,
    updatedAt: prefs.updatedAt.toISOString(),
  }
}

export function serializeReminder(reminder: ReminderSchedule) {
  return {
    id: reminder.id,
    userId: reminder.userId,
    kind: reminder.kind,
    refId: reminder.refId,
    title: reminder.title,
    message: reminder.message,
    cron: reminder.cron,
    timezone: reminder.timezone,
    enabled: reminder.enabled,
    nextRunAt: reminder.nextRunAt?.toISOString() ?? null,
    lastRunAt: reminder.lastRunAt?.toISOString() ?? null,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  }
}

export function serializeTelegramPreferences(prefs: TelegramPreferences) {
  return {
    timezone: prefs.timezone,
    quietHoursStart: prefs.quietHoursStart ? formatTimeOfDay(prefs.quietHoursStart) : null,
    quietHoursEnd: prefs.quietHoursEnd ? formatTimeOfDay(prefs.quietHoursEnd) : null,
  }
}
