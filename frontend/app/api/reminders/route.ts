import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import {
  createReminder,
  listReminders,
  serializeReminder,
} from '@/lib/notifications/repository'
import { parseApiJsonBody } from '@/lib/validation/api-body'
import { reminderCreateSchema } from '@/lib/validation/notifications'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reminders
 * POST /api/reminders
 */
export async function GET(): Promise<Response> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const items = await listReminders(supabase, auth.user.id)
    return jsonOk(items.map(serializeReminder))
  } catch (err) {
    const api = toApiError(err, 'Не удалось загрузить напоминания')
    return jsonError(api.status, api.message, { code: api.code })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const body: unknown = await request.json().catch(() => null)
    const parsed = parseApiJsonBody(reminderCreateSchema, body)
    if (!parsed.success) return parsed.response

    const reminder = await createReminder(supabase, auth.user.id, parsed.data)
    return jsonOk(serializeReminder(reminder), 201)
  } catch (err) {
    const api = toApiError(err, 'Не удалось создать напоминание')
    return jsonError(api.status, api.message, { code: api.code })
  }
}
