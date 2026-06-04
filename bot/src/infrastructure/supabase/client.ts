import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'
import { loadConfig } from '../config.js'
import type { Database } from '../../domain/database.types.js'

let cached: SupabaseClient<Database> | null = null

/**
 * Service-role клиент.
 * ⚠️ Полностью обходит RLS. Каждое query ОБЯЗАНО фильтровать по user_id явно.
 * Используется только внутри bot-сервиса.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (cached) return cached

  const { supabase } = loadConfig()
  cached = createClient<Database>(supabase.url, supabase.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'x-tracker-bot': 'service-role' },
    },
    // Node 20 (Docker Alpine) has no native WebSocket — required by @supabase/realtime-js
    realtime: { transport: ws as unknown as typeof WebSocket },
  })

  return cached
}

export type AdminClient = SupabaseClient<Database>
