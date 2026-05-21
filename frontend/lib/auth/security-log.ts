import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type SecurityLogPayload = {
  userId: string
  action: string
  resource?: string
  details?: Record<string, unknown>
}

/**
 * Best-effort security audit logging (RLS: insert own rows only).
 * Never blocks the caller on failure.
 */
export async function logSecurityEvent(
  supabase: SupabaseClient<Database> | undefined,
  payload: SecurityLogPayload
): Promise<void> {
  if (!supabase) return
  try {
    const row: Database['public']['Tables']['security_audit_log']['Insert'] = {
      user_id: payload.userId,
      action: payload.action,
      resource: payload.resource ?? null,
      details: (payload.details ?? {}) as Database['public']['Tables']['security_audit_log']['Insert']['details'],
    }
    await supabase.from('security_audit_log').insert(row)
  } catch {
    // ignore — logging must not break UX
  }
}
