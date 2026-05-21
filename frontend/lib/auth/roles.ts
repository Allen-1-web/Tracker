import type { UserRole } from '@/lib/supabase/database.types'

export type { UserRole }

export const USER_ROLES = ['user', 'admin'] as const satisfies readonly UserRole[]

export function isAdminRole(role: UserRole | null | undefined): role is 'admin' {
  return role === 'admin'
}

export function isUserRole(role: UserRole | null | undefined): role is 'user' {
  return role === 'user' || role == null
}
