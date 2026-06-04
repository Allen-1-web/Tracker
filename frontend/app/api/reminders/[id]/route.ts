import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import {
  deleteReminder,
  serializeReminder,
  updateReminder,
} from '@/lib/notifications/repository'
import { parseApiJsonBody } from '@/lib/validation/api-body'
import { reminderPatchSchema } from '@/lib/validation/notifications'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/reminders/[id]
 * DELETE /api/reminders/[id]
 */
export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params
    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const body: unknown = await request.json().catch(() => null)
    const parsed = parseApiJsonBody(reminderPatchSchema, body)
    if (!parsed.success) return parsed.response

    const reminder = await updateReminder(supabase, auth.user.id, id, parsed.data)
    return jsonOk(serializeReminder(reminder))
  } catch (err) {
    const api = toApiError(err, 'Не удалось обновить напоминание')
    return jsonError(api.status, api.message, { code: api.code })
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params
    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const result = await deleteReminder(supabase, auth.user.id, id)
    if (!result.removed) {
      return jsonError(HttpStatus.BAD_REQUEST, 'Напоминание не найдено', { code: 'not_found' })
    }
    return jsonOk(result)
  } catch (err) {
    const api = toApiError(err, 'Не удалось удалить напоминание')
    return jsonError(api.status, api.message, { code: api.code })
  }
}
