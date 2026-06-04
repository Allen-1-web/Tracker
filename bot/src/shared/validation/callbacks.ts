import { z } from 'zod'

/** Меню: m:hab | m:gol | m:nut | m:rep | m:rem | m:set | m:home */
export const menuCallbackSchema = z.enum([
  'm:hab',
  'm:gol',
  'm:nut',
  'm:rep',
  'm:rem',
  'm:set',
  'm:home',
])

/** Чекин привычки: ht:<uuid> */
export const habitToggleCallbackSchema = z
  .string()
  .regex(/^ht:[0-9a-f-]{36}$/i, 'invalid habit toggle callback')

/** Вкл/выкл напоминания: rt:<uuid> */
export const reminderToggleCallbackSchema = z
  .string()
  .regex(/^rt:[0-9a-f-]{36}$/i, 'invalid reminder toggle callback')

export type MenuCallback = z.infer<typeof menuCallbackSchema>

export function parseMenuCallback(data: string): MenuCallback | null {
  const parsed = menuCallbackSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

export function parseHabitToggleCallback(data: string): string | null {
  const parsed = habitToggleCallbackSchema.safeParse(data)
  if (!parsed.success) return null
  return parsed.data.slice(3)
}

export function habitToggleCallback(habitId: string): string {
  return `ht:${habitId}`
}

export function parseReminderToggleCallback(data: string): string | null {
  const parsed = reminderToggleCallbackSchema.safeParse(data)
  if (!parsed.success) return null
  return parsed.data.slice(3)
}

export function reminderToggleCallback(reminderId: string): string {
  return `rt:${reminderId}`
}
