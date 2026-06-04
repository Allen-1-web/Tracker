import type { AdminClient } from '../client.js'
import type { Database } from '../../../domain/database.types.js'
import type { NewReminder, ReminderKind, ReminderSchedule } from '../../../domain/reminder.js'
import { BotError } from '../../../domain/errors.js'
import { localTimeToCron, nextRunOf, parseTimeOfDay } from '../../../shared/time/timezone.js'

type Row = Database['public']['Tables']['reminder_schedules']['Row']

function toDomain(row: Row): ReminderSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as ReminderKind,
    refId: row.ref_id,
    title: row.title,
    message: row.message,
    cron: row.cron,
    timezone: row.timezone,
    enabled: row.enabled,
    nextRunAt: row.next_run_at ? new Date(row.next_run_at) : null,
    lastRunAt: row.last_run_at ? new Date(row.last_run_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function computeNextRun(cron: string, timezone: string, after?: Date): Date | null {
  return nextRunOf(cron, timezone, after)
}

export class ReminderRepository {
  constructor(private readonly db: AdminClient) {}

  async listByUserId(userId: string): Promise<ReminderSchedule[]> {
    const { data, error } = await this.db
      .from('reminder_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw new BotError('internal', error.message, { cause: error })
    return (data ?? []).map(toDomain)
  }

  async findById(userId: string, reminderId: string): Promise<ReminderSchedule | null> {
    const { data, error } = await this.db
      .from('reminder_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('id', reminderId)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    return data ? toDomain(data) : null
  }

  async findByIdGlobal(reminderId: string): Promise<ReminderSchedule | null> {
    const { data, error } = await this.db
      .from('reminder_schedules')
      .select('*')
      .eq('id', reminderId)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    return data ? toDomain(data) : null
  }

  /** Напоминания, у которых наступило время отправки. */
  async listDue(now: Date, limit = 100): Promise<ReminderSchedule[]> {
    const { data, error } = await this.db
      .from('reminder_schedules')
      .select('*')
      .eq('enabled', true)
      .not('next_run_at', 'is', null)
      .lte('next_run_at', now.toISOString())
      .order('next_run_at', { ascending: true })
      .limit(limit)
    if (error) throw new BotError('internal', error.message, { cause: error })
    return (data ?? []).map(toDomain)
  }

  async create(input: NewReminder): Promise<ReminderSchedule> {
    const nextRun = computeNextRun(input.cron, input.timezone)
    const payload: Database['public']['Tables']['reminder_schedules']['Insert'] = {
      user_id: input.userId,
      kind: input.kind,
      ref_id: input.refId ?? null,
      title: input.title,
      message: input.message ?? null,
      cron: input.cron,
      timezone: input.timezone,
      enabled: input.enabled ?? true,
      next_run_at: nextRun?.toISOString() ?? null,
    }

    const { data, error } = await this.db
      .from('reminder_schedules')
      .insert(payload)
      .select('*')
      .single()
    if (error || !data) {
      throw new BotError('internal', error?.message ?? 'insert failed', { cause: error })
    }
    return toDomain(data)
  }

  async setEnabled(userId: string, reminderId: string, enabled: boolean): Promise<ReminderSchedule> {
    const existing = await this.findById(userId, reminderId)
    if (!existing) throw new BotError('not_found', 'Напоминание не найдено')

    const patch: Database['public']['Tables']['reminder_schedules']['Update'] = { enabled }
    if (enabled && !existing.nextRunAt) {
      const nextRun = computeNextRun(existing.cron, existing.timezone)
      patch.next_run_at = nextRun?.toISOString() ?? null
    }

    const { data, error } = await this.db
      .from('reminder_schedules')
      .update(patch)
      .eq('user_id', userId)
      .eq('id', reminderId)
      .select('*')
      .single()
    if (error || !data) {
      throw new BotError('internal', error?.message ?? 'update failed', { cause: error })
    }
    return toDomain(data)
  }

  async markRun(reminderId: string, lastRunAt: Date, nextRunAt: Date | null): Promise<void> {
    const { error } = await this.db
      .from('reminder_schedules')
      .update({
        last_run_at: lastRunAt.toISOString(),
        next_run_at: nextRunAt?.toISOString() ?? null,
      })
      .eq('id', reminderId)
    if (error) throw new BotError('internal', error.message, { cause: error })
  }

  /** Пересчитать next_run_at для всех включённых напоминаний без него. */
  async backfillMissingNextRun(limit = 200): Promise<number> {
    const { data, error } = await this.db
      .from('reminder_schedules')
      .select('*')
      .eq('enabled', true)
      .is('next_run_at', null)
      .limit(limit)
    if (error) throw new BotError('internal', error.message, { cause: error })

    let updated = 0
    for (const row of data ?? []) {
      const nextRun = computeNextRun(row.cron, row.timezone)
      if (!nextRun) continue
      const { error: updErr } = await this.db
        .from('reminder_schedules')
        .update({ next_run_at: nextRun.toISOString() })
        .eq('id', row.id)
      if (!updErr) updated++
    }
    return updated
  }

  /** Создать daily-напоминание из profiles.reminder_time, если расписаний ещё нет. */
  async ensureFromProfile(userId: string, timezone: string): Promise<ReminderSchedule | null> {
    const existing = await this.listByUserId(userId)
    if (existing.length > 0) return null

    const { data: profile, error } = await this.db
      .from('profiles')
      .select('reminder_time, reminders_enabled')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    if (!profile?.reminders_enabled || !profile.reminder_time) return null

    const parsed = parseTimeOfDay(profile.reminder_time)
    if (!parsed) return null

    return this.create({
      userId,
      kind: 'custom',
      title: 'Ежедневное напоминание',
      message: 'Время проверить привычки и цели в Tracker.',
      cron: localTimeToCron(parsed.hour, parsed.minute),
      timezone,
    })
  }
}
