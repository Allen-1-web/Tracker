import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Supabase (@supabase/ssr) сохраняет access_token / refresh_token в cookies
 * и автоматически добавляет Authorization ко всем PostgREST-запросам.
 */
export async function syncSessionAfterSignIn(
  supabase: SupabaseClient<Database>,
  session: Session | null
): Promise<Session | null> {
  if (!session?.access_token || !session.refresh_token) return session
  const { data, error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  if (error) throw error
  return data.session ?? session
}

export function getBearerToken(session: Session | null): string | null {
  return session?.access_token ?? null
}
