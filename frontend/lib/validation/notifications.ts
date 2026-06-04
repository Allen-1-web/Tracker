import { z } from 'zod'
import {
  reminderMessageField,
  reminderMessageNullableField,
  reminderTimeField,
  reminderTitleField,
} from './primitives'

const timeField = z
  .string()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Формат времени: ЧЧ:ММ')

export const notificationPreferencesSchema = z.object({
  userId: z.string().uuid(),
  dailySummary: z.boolean(),
  dailySummaryTime: timeField,
  weeklyReport: z.boolean(),
  weeklyReportDow: z.number().int().min(0).max(6),
  weeklyReportTime: timeField,
  hydration: z.boolean(),
  hydrationIntervalMinutes: z.number().int().min(15).max(1440),
  hydrationStartTime: timeField,
  hydrationEndTime: timeField,
  nutritionReminders: z.boolean(),
  habitReminders: z.boolean(),
  goalDeadlineReminders: z.boolean(),
  missedHabitAlerts: z.boolean(),
  updatedAt: z.string().datetime({ offset: true }),
})

export type NotificationPreferencesDto = z.infer<typeof notificationPreferencesSchema>

export const notificationPreferencesPatchSchema = z
  .object({
    dailySummary: z.boolean().optional(),
    dailySummaryTime: timeField.optional(),
    weeklyReport: z.boolean().optional(),
    weeklyReportDow: z.number().int().min(0).max(6).optional(),
    weeklyReportTime: timeField.optional(),
    hydration: z.boolean().optional(),
    hydrationIntervalMinutes: z.number().int().min(15).max(1440).optional(),
    hydrationStartTime: timeField.optional(),
    hydrationEndTime: timeField.optional(),
    nutritionReminders: z.boolean().optional(),
    habitReminders: z.boolean().optional(),
    goalDeadlineReminders: z.boolean().optional(),
    missedHabitAlerts: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Нет полей для обновления' })

export const reminderScheduleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: z.enum(['habit', 'goal', 'nutrition', 'water', 'sleep', 'workout', 'custom']),
  refId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  message: z.string().max(1000).nullable(),
  cron: z.string().min(9).max(100),
  timezone: z.string().min(1).max(64),
  enabled: z.boolean(),
  nextRunAt: z.string().datetime({ offset: true }).nullable(),
  lastRunAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
})

export type ReminderScheduleDto = z.infer<typeof reminderScheduleSchema>

export const reminderCreateSchema = z.object({
  title: reminderTitleField,
  message: reminderMessageField.optional(),
  time: timeField,
  timezone: z.string().min(1).max(64).optional(),
})

export const reminderPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    title: reminderTitleField.optional(),
    message: reminderMessageNullableField.optional(),
    time: timeField.optional(),
    timezone: z.string().min(1).max(64).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Нет полей для обновления' })

export const telegramPreferencesSchema = z.object({
  timezone: z.string().min(1).max(64),
  quietHoursStart: reminderTimeField.nullable(),
  quietHoursEnd: reminderTimeField.nullable(),
})

export const telegramPreferencesPatchSchema = z
  .object({
    timezone: z.string().min(1).max(64).optional(),
    quietHoursStart: reminderTimeField.nullable().optional(),
    quietHoursEnd: reminderTimeField.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Нет полей для обновления' })
  .refine(
    (v) => {
      const hasStart = v.quietHoursStart !== undefined
      const hasEnd = v.quietHoursEnd !== undefined
      if (!hasStart && !hasEnd) return true
      if (hasStart && hasEnd) {
        const start = v.quietHoursStart
        const end = v.quietHoursEnd
        return (start == null && end == null) || (start != null && end != null)
      }
      return false
    },
    { message: 'Укажите оба времени тихих часов или сбросьте оба' },
  )
