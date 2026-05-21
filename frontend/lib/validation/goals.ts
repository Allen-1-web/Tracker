import { z } from 'zod'
import {
  futureDateString,
  goalTypeEnum,
  nonNegativeNumber,
  optionalDescriptionField,
  positiveNumber,
  titleField,
  unitField,
} from './primitives'

/** Поля goals.name в проекте соответствуют title в ТЗ. */
export const goalTitleField = titleField

export const goalCreateSchema = z
  .object({
    name: goalTitleField,
    description: optionalDescriptionField,
    type: goalTypeEnum.default('numeric'),
    targetValue: positiveNumber,
    currentValue: nonNegativeNumber.default(0),
    unit: unitField,
    deadline: futureDateString(),
    categoryId: z.string().min(1, 'Выберите категорию'),
    category: z.string().optional(),
    linkedHabitIds: z.array(z.string().uuid()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.currentValue > data.targetValue) {
      ctx.addIssue({
        code: 'custom',
        message: 'Текущее значение не может превышать цель',
        path: ['currentValue'],
      })
    }
  })

export const goalFormSchema = z.object({
  name: goalTitleField,
  targetValue: positiveNumber,
  unit: unitField,
  categoryId: z.string().min(1, 'Выберите категорию'),
  deadline: futureDateString(),
})

export const goalUpdateSchema = z
  .object({
    name: goalTitleField.optional(),
    description: optionalDescriptionField,
    type: goalTypeEnum.optional(),
    targetValue: positiveNumber.optional(),
    currentValue: nonNegativeNumber.optional(),
    unit: unitField,
    deadline: z.coerce.date().optional(),
    categoryId: z.string().min(1).optional(),
    category: z.string().optional(),
    linkedHabitIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.currentValue !== undefined &&
      data.targetValue !== undefined &&
      data.currentValue > data.targetValue
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Текущее значение не может превышать цель',
        path: ['currentValue'],
      })
    }
  })

/** Упрощённый статус для UI: только активна или выполнена (без paused/overdue в данных). */
export function deriveGoalStatus(
  currentValue: number,
  targetValue: number
): 'active' | 'completed' {
  if (currentValue >= targetValue) return 'completed'
  return 'active'
}

/** Шаг онбординга: цель без categoryId в форме */
export const onboardingGoalStepSchema = z.object({
  name: goalTitleField,
  target: z
    .string()
    .min(1, 'Введите целевое значение')
    .refine((s) => {
      const n = Number(s.replace(',', '.'))
      return Number.isFinite(n) && n > 0
    }, 'Введите число больше 0'),
  deadline: futureDateString(),
})

export const onboardingHabitStepSchema = z.object({
  name: goalTitleField,
  categoryId: z.string().min(1, 'Выберите категорию'),
  icon: z.string().min(1, 'Выберите иконку'),
})

export type GoalCreateInput = z.infer<typeof goalCreateSchema>
export type GoalFormInput = z.infer<typeof goalFormSchema>
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>
