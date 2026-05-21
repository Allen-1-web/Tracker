import { z } from 'zod'
import { nonNegativeNumber, noteField, uuidField } from './primitives'

/** notes из ТЗ → goal_progress.note */
export const goalProgressNoteField = noteField

export function createGoalProgressFormSchema(targetValue: number) {
  return z
    .object({
      value: nonNegativeNumber,
      note: goalProgressNoteField,
    })
    .superRefine((data, ctx) => {
      if (data.value > targetValue) {
        ctx.addIssue({
          code: 'custom',
          message: 'Значение не может превышать цель',
          path: ['value'],
        })
      }
    })
}

export const goalProgressInsertSchema = z.object({
  goalId: uuidField,
  date: z.coerce.date(),
  value: nonNegativeNumber,
  note: goalProgressNoteField,
})

export type GoalProgressInsertInput = z.infer<typeof goalProgressInsertSchema>
