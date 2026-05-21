'use client'

import { canAccessAdmin } from '@/lib/auth/permissions'
import { useAuthContext } from './useRole'

/** True when the signed-in user has the `admin` role. */
export function useAdmin(): boolean {
  return canAccessAdmin(useAuthContext())
}
