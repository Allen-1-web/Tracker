import { createClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

export function getSupabaseAdmin() {
  const url = requireEnv('E2E_SUPABASE_URL')
  const serviceRole = requireEnv('E2E_SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  let page = 1
  const perPage = 200
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
    if (found?.id) return found.id
    if (data.users.length < perPage) return null
    page += 1
  }
  return null
}

export async function deleteUserById(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw error
}

export async function confirmUserEmailById(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true })
  if (error) throw error
}

/** Обход rate limit UI signup — пользователь сразу confirmed (реальный Auth user). */
export async function createConfirmedUser(params: {
  email: string
  password: string
  name: string
}): Promise<string> {
  const supabase = getSupabaseAdmin()
  const existing = await findUserIdByEmail(params.email)
  if (existing) {
    await supabase.auth.admin.updateUserById(existing, {
      email_confirm: true,
      password: params.password,
      user_metadata: { full_name: params.name },
    })
    return existing
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: { full_name: params.name },
  })
  if (error) throw error
  if (!data.user?.id) throw new Error('E2E: admin.createUser не вернул id')
  return data.user.id
}

