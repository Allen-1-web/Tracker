'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { apiJson } from '@/lib/api/client-fetch'
import { finalizeClientApiError } from '@/lib/auth/apply-api-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/empty-state'
import { cronToTimeLabel } from '@/lib/notifications/time'
import {
  reminderCreateSchema,
  reminderScheduleSchema,
  type ReminderScheduleDto,
} from '@/lib/validation/notifications'

const remindersListSchema = z.array(reminderScheduleSchema)

export function ReminderSchedulesPanel(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ReminderScheduleDto[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiJson('/api/reminders', { method: 'GET' }, (raw) =>
        remindersListSchema.parse(raw),
      )
      setItems(data)
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(finalizeClientApiError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    setFormError(null)
    const parsed = reminderCreateSchema.safeParse({
      title,
      time,
      message: message.trim() || undefined,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Проверьте поля')
      return
    }

    setCreating(true)
    try {
      const created = await apiJson(
        '/api/reminders',
        { method: 'POST', body: JSON.stringify(parsed.data) },
        (raw) => reminderScheduleSchema.parse(raw),
      )
      setItems((prev) => [...prev, created])
      setTitle('')
      setMessage('')
      setErrorMessage(null)
    } catch (err) {
      setFormError(finalizeClientApiError(err).message)
    } finally {
      setCreating(false)
    }
  }

  const toggleEnabled = async (item: ReminderScheduleDto) => {
    const prev = items
    setItems((list) =>
      list.map((r) => (r.id === item.id ? { ...r, enabled: !r.enabled } : r)),
    )
    try {
      const updated = await apiJson(
        `/api/reminders/${item.id}`,
        { method: 'PATCH', body: JSON.stringify({ enabled: !item.enabled }) },
        (raw) => reminderScheduleSchema.parse(raw),
      )
      setItems((list) => list.map((r) => (r.id === item.id ? updated : r)))
    } catch (err) {
      setItems(prev)
      setErrorMessage(finalizeClientApiError(err).message)
    }
  }

  const remove = async (id: string) => {
    const prev = items
    setItems((list) => list.filter((r) => r.id !== id))
    try {
      await apiJson(`/api/reminders/${id}`, { method: 'DELETE' })
    } catch (err) {
      setItems(prev)
      setErrorMessage(finalizeClientApiError(err).message)
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загрузка напоминаний…
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="reminders-panel">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-3 text-sm text-[var(--destructive)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-[var(--border)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Новое ежедневное напоминание
        </p>
        <div className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reminder-title">Название</Label>
              <Input
                id="reminder-title"
                data-testid="reminder-title"
                placeholder="Проверить привычки"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setFormError(null)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reminder-time">Время</Label>
              <Input
                id="reminder-time"
                type="time"
                data-testid="reminder-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full sm:w-36"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reminder-message">Текст (необязательно)</Label>
            <Input
              id="reminder-message"
              data-testid="reminder-message"
              placeholder="Короткое сообщение в Telegram"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {formError && <p className="text-xs text-[var(--destructive)]">{formError}</p>}
          <Button
            type="button"
            size="sm"
            disabled={creating}
            onClick={() => void handleCreate()}
            data-testid="reminder-create"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Добавить
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Напоминаний пока нет"
          description="Добавьте ежедневное напоминание — бот отправит его в Telegram в указанное время."
          compact
          className="py-6"
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const timeLabel = cronToTimeLabel(item.cron) ?? item.cron
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3"
                data-testid="reminder-item"
              >
                <Switch
                  checked={item.enabled}
                  onCheckedChange={() => void toggleEnabled(item)}
                  aria-label={`Включить «${item.title}»`}
                  data-testid="reminder-item-toggle"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {timeLabel} · {item.timezone}
                    {!item.enabled ? ' · выкл.' : ''}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-[var(--destructive)]"
                  type="button"
                  aria-label="Удалить"
                  onClick={() => void remove(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
