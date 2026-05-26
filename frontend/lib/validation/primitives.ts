import { z } from 'zod'
import { containsDangerousMarkup, sanitizeText } from './sanitize'

export const goalStatusEnum = z.enum(['active', 'completed', 'paused'])

export const mealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])

export const goalTypeEnum = z.enum(['numeric', 'binary'])

export const themeEnum = z.enum(['light', 'dark', 'system'])

function sanitizedString() {
  return z.string().transform((v, ctx) => {
    if (containsDangerousMarkup(v)) {
      ctx.addIssue({ code: 'custom', message: 'Недопустимые символы или HTML в тексте' })
      return z.NEVER
    }
    return sanitizeText(v)
  })
}

export const titleField = sanitizedString().pipe(
  z.string().min(3, 'Минимум 3 символа').max(120, 'Максимум 120 символов')
)

export const reminderTitleField = sanitizedString().pipe(
  z.string().min(1, 'Укажите название').max(200, 'Максимум 200 символов')
)

export const reminderMessageField = sanitizedString()
  .pipe(z.string().max(1000, 'Максимум 1000 символов'))
  .optional()
  .or(z.literal('').transform(() => undefined))

export const reminderMessageNullableField = z.union([z.null(), reminderMessageField])

export const optionalDescriptionField = z
  .union([z.string(), z.undefined()])
  .transform((v) => {
    if (v === undefined) return undefined
    const t = sanitizeText(v)
    return t.length === 0 ? undefined : t
  })
  .refine((v) => v === undefined || v.length <= 1000, 'Максимум 1000 символов')

export const noteField = sanitizedString()
  .pipe(z.string().max(500, 'Максимум 500 символов'))
  .optional()
  .or(z.literal('').transform(() => undefined))

export const unitField = sanitizedString()
  .pipe(z.string().max(20, 'Максимум 20 символов'))
  .optional()
  .or(z.literal('').transform(() => undefined))

export const positiveNumber = z
  .number({ error: 'Введите число' })
  .finite('Введите число')
  .gt(0, 'Значение должно быть больше 0')

export const nonNegativeNumber = z
  .number({ error: 'Введите число' })
  .finite('Введите число')
  .min(0, 'Значение не может быть отрицательным')

export const uuidField = z.string().uuid('Некорректный идентификатор')

export const dateYmdField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: ГГГГ-ММ-ДД')

export function futureDateString(message = 'Дедлайн не может быть в прошлом') {
  return z
    .string()
    .min(1, 'Укажите дату')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Некорректная дата')
    .refine((s) => {
      const d = new Date(s)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      d.setHours(0, 0, 0, 0)
      return d >= today
    }, message)
}

export const reminderTimeField = z
  .string()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Формат времени: ЧЧ:ММ')
  .optional()
  .or(z.literal('').transform(() => undefined))

export const avatarUrlField = z
  .string()
  .url('Некорректный URL')
  .max(2048)
  .optional()
  .or(z.literal('').transform(() => undefined))

export function macrosCaloriesConsistent(
  data: { calories: number; protein: number; fat: number; carbs: number },
  tolerance = 0.15
): boolean {
  const expected = 4 * data.protein + 9 * data.fat + 4 * data.carbs
  if (expected <= 0) return data.calories >= 0
  const diff = Math.abs(data.calories - expected) / expected
  return diff <= tolerance
}
