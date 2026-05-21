import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/** Серверный клиент для Server Components / Route Handlers (сессия из cookies). */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll из Server Component — игнорируем; middleware обновит cookies
        }
      },
    },
  })
}
