import { z } from 'zod'
import {
  avatarUrlField,
  reminderTimeField,
  themeEnum,
  titleField,
} from './primitives'

/** username / full_name из ТЗ → profiles.name */
export const profileNameField = titleField

export const profileUpdateSchema = z
  .object({
  name: profileNameField,
  email: z.string().trim().toLowerCase().email('Введите корректный email'),
  avatarUrl: avatarUrlField,
  theme: themeEnum.optional(),
  reminderTime: reminderTimeField,
  remindersEnabled: z.boolean().optional(),
  telegramConnected: z.boolean().optional(),
  telegramUsername: z
    .string()
    .max(32)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})
  .strict()

/** Role changes only via admin_set_user_role RPC — never from profile patch. */
export const profileUpdateSchemaForClient = profileUpdateSchema

export const profileFormSchema = profileUpdateSchema.pick({ name: true, email: true })

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ProfileFormInput = z.infer<typeof profileFormSchema>
