import { z } from 'zod'
/** kcal_goal / protein_goal / fat_goal / carb_goal из ТЗ → nutrition_goals */
export const nutritionGoalsSchema = z.object({
  calories: z
    .number()
    .finite()
    .min(1000, 'Калории: от 1000 до 10000 ккал')
    .max(10000, 'Калории: от 1000 до 10000 ккал'),
  protein: z
    .number()
    .finite()
    .min(0, 'Белки: от 0 до 1000 г')
    .max(1000, 'Белки: от 0 до 1000 г'),
  fat: z
    .number()
    .finite()
    .min(0, 'Жиры: от 0 до 1000 г')
    .max(1000, 'Жиры: от 0 до 1000 г'),
  carbs: z
    .number()
    .finite()
    .min(0, 'Углеводы: от 0 до 2000 г')
    .max(2000, 'Углеводы: от 0 до 2000 г'),
})

export const nutritionGoalsPartialSchema = nutritionGoalsSchema.partial()

export type NutritionGoalsInput = z.infer<typeof nutritionGoalsSchema>
