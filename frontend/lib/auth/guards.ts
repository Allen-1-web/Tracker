import type { Session } from '@supabase/supabase-js'
import type { User } from '@/lib/types'
import { canAccessAdmin, canMutateOwnData } from './permissions'
import { logSecurityEvent } from './security-log'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export class AuthGuardError extends Error {
  readonly code: 'unauthenticated' | 'forbidden'

  constructor(code: 'unauthenticated' | 'forbidden', message: string) {
    super(message)
    this.code = code
    this.name = 'AuthGuardError'
  }
}

export type GuardContext = {
  session: Session | null
  user: User | null
  supabase?: SupabaseClient<Database>
}

export function requireAuth(ctx: GuardContext): asserts ctx is GuardContext & {
  session: Session
  user: User
} {
  if (!ctx.session?.user || !ctx.user?.id) {
    throw new AuthGuardError('unauthenticated', 'Требуется вход в аккаунт')
  }
}

export function requireAdmin(ctx: GuardContext): asserts ctx is GuardContext & {
  session: Session
  user: User
} {
  requireAuth(ctx)
  if (!canAccessAdmin(ctx)) {
    void logSecurityEvent(ctx.supabase, {
      userId: ctx.session.user.id,
      action: 'unauthorized_admin_access',
      resource: 'admin',
    })
    throw new AuthGuardError('forbidden', 'Доступ только для администратора')
  }
}

export function requireSessionForMutation(ctx: GuardContext): Session {
  requireAuth(ctx)
  if (!canMutateOwnData(ctx)) {
    throw new AuthGuardError('unauthenticated', 'Требуется вход в аккаунт')
  }
  return ctx.session
}

export function requireRecordOwner(recordUserId: string, ctx: GuardContext): void {
  requireAuth(ctx)
  if (ctx.session.user.id !== recordUserId && !canAccessAdmin(ctx)) {
    void logSecurityEvent(ctx.supabase, {
      userId: ctx.session.user.id,
      action: 'unauthorized_record_access',
      resource: 'record',
      details: { recordUserId },
    })
    throw new AuthGuardError('forbidden', 'Нет доступа к этой записи')
  }
}
