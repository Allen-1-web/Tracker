import { z } from 'zod'
import { sanitizeText } from './sanitize'

export const categoryNameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(
    z
      .string()
      .min(1, 'Введите название')
      .max(40, 'Не длиннее 40 символов')
  )

export const categoryCreateSchema = z.object({
  name: categoryNameSchema,
  color: z.string().min(1).max(32),
  icon: z.string().min(1).max(8),
})

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
