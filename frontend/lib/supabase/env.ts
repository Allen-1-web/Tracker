/** Project URL из дашборда — только хост, без /rest/v1 и без хвостового слеша. */
export function getSupabaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ''
  let u = raw.trim()
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim()
  }
  u = u.replace(/\/+$/, '')
  const restPath = '/rest/v1'
  if (u.endsWith(restPath)) {
    u = u.slice(0, -restPath.length).replace(/\/+$/, '')
  }
  if (!u) {
    throw new Error(
      'Задайте SUPABASE_URL в .env.local (см. .env.example). Ожидается https://xxxx.supabase.co без /rest/v1.'
    )
  }
  try {
    new URL(u)
  } catch {
    throw new Error('Некорректный SUPABASE_URL.')
  }
  return u
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ''
  const trimmed = key.trim()
  if (!trimmed) {
    throw new Error('Задайте SUPABASE_ANON_KEY в .env.local (см. .env.example).')
  }
  return trimmed
}
