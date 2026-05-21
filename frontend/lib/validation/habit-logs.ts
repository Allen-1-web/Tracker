import { z } from 'zod'
import { dateYmdField, uuidField } from './primitives'

/** habit_logs: task_id из ТЗ → habit_id в БД. */
export const habitLogInsertSchema = z.object({
  habitId: uuidField,
  userId: uuidField,
  logDate: dateYmdField,
  completed: z.boolean().default(true),
})

export const habitLogToggleSchema = z.object({
  habitId: uuidField,
  logDate: dateYmdField.optional(),
})

export type HabitLogInsertInput = z.infer<typeof habitLogInsertSchema>
export type HabitLogToggleInput = z.infer<typeof habitLogToggleSchema>
