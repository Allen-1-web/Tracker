import { z } from 'zod'

const emailField = z
  .string()
  .min(1, 'Email обязателен')
  .trim()
  .email('Введите корректный email')

const passwordField = z
  .string()
  .min(1, 'Пароль обязателен')
  .min(6, 'Минимум 6 символов')

export const loginFormSchema = z.object({
  email: emailField,
  password: passwordField,
})

export const registerFormSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').trim().min(2, 'Минимум 2 символа'),
  email: emailField,
  password: passwordField,
})

export type LoginFormInput = z.infer<typeof loginFormSchema>
export type RegisterFormInput = z.infer<typeof registerFormSchema>
