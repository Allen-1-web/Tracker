import type { Session } from '@supabase/supabase-js'
import type { User } from '@/lib/types'
import { isAdminRole, type UserRole } from './roles'

export type AuthContext = {
  session: Session | null
  user: User | null
}

export function getRole(ctx: AuthContext): UserRole {
  return ctx.user?.role ?? 'user'
}

export function canAccessAdmin(ctx: AuthContext): boolean {
  return Boolean(ctx.session?.user) && isAdminRole(getRole(ctx))
}

export function canMutateOwnData(ctx: AuthContext): boolean {
  return Boolean(ctx.session?.user)
}

export function canChangeRole(ctx: AuthContext): boolean {
  return canAccessAdmin(ctx)
}

export function isRecordOwner(recordUserId: string, ctx: AuthContext): boolean {
  return ctx.session?.user?.id === recordUserId
}

export function canAccessRecord(recordUserId: string, ctx: AuthContext): boolean {
  if (!ctx.session?.user) return false
  return isRecordOwner(recordUserId, ctx) || canAccessAdmin(ctx)
}
