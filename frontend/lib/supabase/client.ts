import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'
import type { Database } from './database.types'

let browserClient: SupabaseClient<Database> | null = null

/** Браузерный клиент Supabase (Auth + PostgREST), сессия в cookies через @supabase/ssr. */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    ) as unknown as SupabaseClient<Database>
  }
  return browserClient
}

export type { Database } from './database.types'
