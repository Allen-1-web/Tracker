import { z } from 'zod'
import {
  mealTypeEnum,
  macrosCaloriesConsistent,
  nonNegativeNumber,
  positiveNumber,
  uuidField,
  dateYmdField,
} from './primitives'

/** meal_entries + product_name из food_items.name */
export const mealEntryInsertSchema = z
  .object({
    foodId: uuidField,
    date: dateYmdField,
    mealType: mealTypeEnum,
    amount: positiveNumber,
    calories: nonNegativeNumber,
    protein: nonNegativeNumber,
    fat: nonNegativeNumber,
    carbs: nonNegativeNumber,
    productName: z.string().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (!macrosCaloriesConsistent(data)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Калории не согласуются с БЖУ (допуск ±15%)',
        path: ['calories'],
      })
    }
  })

export const mealEntryFormSchema = z.object({
  amount: positiveNumber,
  mealType: mealTypeEnum,
})

export type MealEntryInsertInput = z.infer<typeof mealEntryInsertSchema>
export type MealEntryFormInput = z.infer<typeof mealEntryFormSchema>
