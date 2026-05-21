'use client'

import { useStore } from '@/lib/store'
import { getRole, type AuthContext } from '@/lib/auth/permissions'
import type { UserRole } from '@/lib/auth/roles'

export function useAuthContext(): AuthContext {
  const session = useStore((s) => s.session)
  const user = useStore((s) => s.user)
  return { session, user: user.id ? user : null }
}

/** Current user role from loaded profile (defaults to `user`). */
export function useRole(): UserRole {
  return getRole(useAuthContext())
}
