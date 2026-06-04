'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { apiJson } from '@/lib/api/client-fetch'
import { finalizeClientApiError } from '@/lib/auth/apply-api-error'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  telegramPreferencesSchema,
} from '@/lib/validation/notifications'
import { telegramStatusSchema, type TelegramStatus } from '@/lib/validation/telegram'
import { TIMEZONE_OPTIONS } from '@/lib/notifications/time'

const telegramPrefsNullableSchema = telegramPreferencesSchema.nullable()

export function TelegramPreferencesPanel(): React.JSX.Element | null {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [timezone, setTimezone] = useState('Europe/Moscow')
  const [quietEnabled, setQuietEnabled] = useState(false)
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('08:00')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const status = await apiJson<TelegramStatus>(
        '/api/telegram/status',
        { method: 'GET' },
        (raw) => telegramStatusSchema.parse(raw),
      )
      setConnected(status.connected)
      if (!status.connected) {
        setErrorMessage(null)
        return
      }

      const prefs = await apiJson(
        '/api/telegram/preferences',
        { method: 'GET' },
        (raw) => telegramPrefsNullableSchema.parse(raw),
      )
      if (prefs) {
        setTimezone(prefs.timezone)
        const hasQuiet = prefs.quietHoursStart != null && prefs.quietHoursEnd != null
        setQuietEnabled(hasQuiet)
        if (prefs.quietHoursStart) setQuietStart(prefs.quietHoursStart)
        if (prefs.quietHoursEnd) setQuietEnd(prefs.quietHoursEnd)
      } else if (status.timezone) {
        setTimezone(status.timezone)
      }
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

  const save = async (patch: {
    timezone?: string
    quietHoursStart?: string | null
    quietHoursEnd?: string | null
  }) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const data = await apiJson(
        '/api/telegram/preferences',
        { method: 'PATCH', body: JSON.stringify(patch) },
        (raw) => telegramPreferencesSchema.parse(raw),
      )
      setTimezone(data.timezone)
      const hasQuiet = data.quietHoursStart != null && data.quietHoursEnd != null
      setQuietEnabled(hasQuiet)
      if (data.quietHoursStart) setQuietStart(data.quietHoursStart)
      if (data.quietHoursEnd) setQuietEnd(data.quietHoursEnd)
    } catch (err) {
      setErrorMessage(finalizeClientApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загрузка часового пояса…
      </div>
    )
  }

  if (!connected) return null

  return (
    <div className="space-y-4 border-t border-[var(--border)] pt-4" data-testid="telegram-preferences-panel">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-3 text-sm text-[var(--destructive)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      {saving && <p className="text-xs text-[var(--muted-foreground)]">Сохранение…</p>}

      <div className="space-y-1.5">
        <Label>Часовой пояс</Label>
        <Select
          value={timezone}
          onValueChange={(v) => {
            setTimezone(v)
            void save({ timezone: v })
          }}
        >
          <SelectTrigger data-testid="telegram-timezone-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[var(--muted-foreground)]">
          Используется для сводок и напоминаний в Telegram
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Тихие часы</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            В это время бот не шлёт уведомления
          </p>
        </div>
        <Switch
          data-testid="telegram-quiet-hours-toggle"
          checked={quietEnabled}
          onCheckedChange={(checked) => {
            setQuietEnabled(checked)
            if (checked) {
              void save({ quietHoursStart: quietStart, quietHoursEnd: quietEnd })
            } else {
              void save({ quietHoursStart: null, quietHoursEnd: null })
            }
          }}
        />
      </div>

      {quietEnabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quiet-start">С</Label>
            <Input
              id="quiet-start"
              type="time"
              data-testid="telegram-quiet-start"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              onBlur={() => void save({ quietHoursStart: quietStart, quietHoursEnd: quietEnd })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quiet-end">До</Label>
            <Input
              id="quiet-end"
              type="time"
              data-testid="telegram-quiet-end"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              onBlur={() => void save({ quietHoursStart: quietStart, quietHoursEnd: quietEnd })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
