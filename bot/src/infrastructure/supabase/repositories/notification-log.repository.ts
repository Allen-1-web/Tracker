import type { AdminClient } from '../client.js'
import type { Database, Json } from '../../../domain/database.types.js'
import type { NotificationKind, NotificationStatus } from '../../../domain/notification.js'
import { BotError } from '../../../domain/errors.js'

export interface LogNotificationInput {
  userId: string
  reminderId?: string | null
  kind: NotificationKind | string
  status: NotificationStatus
  payload?: unknown
  error?: string | null
  attempt?: number
}

export class NotificationLogRepository {
  constructor(private readonly db: AdminClient) {}

  async insert(input: LogNotificationInput): Promise<void> {
    const payload: Database['public']['Tables']['notification_logs']['Insert'] = {
      user_id: input.userId,
      reminder_id: input.reminderId ?? null,
      kind: input.kind,
      channel: 'telegram',
      status: input.status,
      payload: (input.payload ?? null) as Json,
      error: input.error ?? null,
      attempt: input.attempt ?? 1,
    }

    const { error } = await this.db.from('notification_logs').insert(payload)
    if (error) throw new BotError('internal', error.message, { cause: error })
  }

  async hasSentSince(userId: string, kind: string, since: Date): Promise<boolean> {
    const { data, error } = await this.db
      .from('notification_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('kind', kind)
      .eq('status', 'sent')
      .gte('created_at', since.toISOString())
      .limit(1)
    if (error) throw new BotError('internal', error.message, { cause: error })
    return (data?.length ?? 0) > 0
  }

  async getLastSentAt(userId: string, kind: string): Promise<Date | null> {
    const { data, error } = await this.db
      .from('notification_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('kind', kind)
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    return data?.created_at ? new Date(data.created_at) : null
  }
}
