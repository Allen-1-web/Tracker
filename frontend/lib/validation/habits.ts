import { z } from 'zod'
import { titleField } from './primitives'

/**
 * В проекте сущность habits соответствует tasks из ТЗ (без type/priority/status).
 * Валидация названия и расписания привычки.
 */
export const habitFrequencySchema = z.union([
  z.literal('daily'),
  z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Выберите хотя бы один день недели'),
])

export const habitCreateSchema = z.object({
  name: titleField,
  icon: z.string().min(1, 'Выберите иконку'),
  color: z.string().min(1, 'Выберите цвет'),
  categoryId: z.string().min(1, 'Выберите категорию').uuid('Выберите категорию'),
  category: z.string().max(40).optional(),
  frequency: habitFrequencySchema,
  isArchived: z.boolean().default(false),
})

export const habitFormSchema = z
  .object({
    name: titleField,
    icon: z.string().min(1, 'Выберите иконку'),
    color: z.string().min(1, 'Выберите цвет'),
    categoryId: z.string().min(1, 'Выберите категорию'),
    frequencyType: z.enum(['daily', 'custom']),
    frequencyDays: z.array(z.number().int().min(0).max(6)),
  })
  .superRefine((data, ctx) => {
    if (data.frequencyType === 'custom' && data.frequencyDays.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Выберите хотя бы один день недели',
        path: ['frequencyDays'],
      })
    }
  })

export const habitUpdateSchema = habitCreateSchema.partial()

export type HabitCreateInput = z.infer<typeof habitCreateSchema>
export type HabitFormInput = z.infer<typeof habitFormSchema>
export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>
