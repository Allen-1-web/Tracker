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
  notificationPreferencesSchema,
  type NotificationPreferencesDto,
} from '@/lib/validation/notifications'
import { WEEKDAY_OPTIONS } from '@/lib/notifications/time'

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function NotificationPreferencesPanel(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPreferencesDto | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiJson('/api/notifications/preferences', { method: 'GET' }, (raw) =>
        notificationPreferencesSchema.parse(raw),
      )
      setPrefs(data)
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

  const patch = async (updates: Partial<NotificationPreferencesDto>) => {
    if (!prefs) return
    setSaving(true)
    const prev = prefs
    setPrefs({ ...prefs, ...updates })
    setErrorMessage(null)
    try {
      const data = await apiJson('/api/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }, (raw) => notificationPreferencesSchema.parse(raw))
      setPrefs(data)
    } catch (err) {
      setPrefs(prev)
      setErrorMessage(finalizeClientApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !prefs) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загрузка настроек…
      </div>
    )
  }

  if (!prefs) {
    return (
      <div role="alert" className="text-sm text-[var(--destructive)]">
        {errorMessage ?? 'Не удалось загрузить настройки'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-3 text-sm text-[var(--destructive)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      {saving && (
        <p className="text-xs text-[var(--muted-foreground)]">Сохранение…</p>
      )}

      <div className="space-y-1 rounded-lg border border-[var(--border)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Сводки в Telegram
        </p>
        <SettingRow
          title="Ежедневная сводка"
          description="Привычки, цели и калории за день"
        >
          <Switch
            checked={prefs.dailySummary}
            onCheckedChange={(checked) => void patch({ dailySummary: checked })}
            data-testid="notif-daily-summary-toggle"
          />
        </SettingRow>
        {prefs.dailySummary && (
          <div className="space-y-1.5 pb-2">
            <Label htmlFor="daily-summary-time">Время</Label>
            <Input
              id="daily-summary-time"
              type="time"
              value={prefs.dailySummaryTime}
              data-testid="notif-daily-summary-time"
              onChange={(e) => {
                const value = e.target.value
                setPrefs({ ...prefs, dailySummaryTime: value })
                if (/^\d{2}:\d{2}$/.test(value)) void patch({ dailySummaryTime: value })
              }}
              onBlur={(e) => void patch({ dailySummaryTime: e.target.value })}
              className="w-36"
            />
          </div>
        )}

        <SettingRow title="Еженедельный отчёт">
          <Switch
            checked={prefs.weeklyReport}
            onCheckedChange={(checked) => void patch({ weeklyReport: checked })}
          />
        </SettingRow>
        {prefs.weeklyReport && (
          <div className="grid gap-3 pb-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>День недели</Label>
              <Select
                value={String(prefs.weeklyReportDow)}
                onValueChange={(v) => void patch({ weeklyReportDow: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weekly-report-time">Время</Label>
              <Input
                id="weekly-report-time"
                type="time"
                value={prefs.weeklyReportTime}
                onChange={(e) => {
                  const value = e.target.value
                  setPrefs({ ...prefs, weeklyReportTime: value })
                  if (/^\d{2}:\d{2}$/.test(value)) void patch({ weeklyReportTime: value })
                }}
                onBlur={(e) => void patch({ weeklyReportTime: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        )}

        <SettingRow
          title="Невыполненные привычки"
          description="Время совпадает с ежедневной сводкой"
        >
          <Switch
            checked={prefs.missedHabitAlerts}
            onCheckedChange={(checked) => void patch({ missedHabitAlerts: checked })}
          />
        </SettingRow>
      </div>

      <div className="space-y-1 rounded-lg border border-[var(--border)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Напоминания по типам
        </p>
        <SettingRow title="Привычки">
          <Switch
            checked={prefs.habitReminders}
            onCheckedChange={(checked) => void patch({ habitReminders: checked })}
          />
        </SettingRow>
        <SettingRow title="Цели (дедлайны)">
          <Switch
            checked={prefs.goalDeadlineReminders}
            onCheckedChange={(checked) => void patch({ goalDeadlineReminders: checked })}
          />
        </SettingRow>
        <SettingRow title="Питание">
          <Switch
            checked={prefs.nutritionReminders}
            onCheckedChange={(checked) => void patch({ nutritionReminders: checked })}
          />
        </SettingRow>
      </div>

      <div className="space-y-1 rounded-lg border border-[var(--border)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Гидратация
        </p>
        <SettingRow title="Напоминания пить воду">
          <Switch
            checked={prefs.hydration}
            onCheckedChange={(checked) => void patch({ hydration: checked })}
          />
        </SettingRow>
        {prefs.hydration && (
          <div className="grid gap-3 pb-2 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="hydration-interval">Интервал (мин)</Label>
              <Input
                id="hydration-interval"
                type="number"
                min={15}
                max={1440}
                step={15}
                value={prefs.hydrationIntervalMinutes}
                onChange={(e) =>
                  setPrefs({ ...prefs, hydrationIntervalMinutes: Number(e.target.value) })
                }
                onBlur={(e) =>
                  void patch({ hydrationIntervalMinutes: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hydration-start">С</Label>
              <Input
                id="hydration-start"
                type="time"
                value={prefs.hydrationStartTime}
                onChange={(e) => setPrefs({ ...prefs, hydrationStartTime: e.target.value })}
                onBlur={(e) => void patch({ hydrationStartTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hydration-end">До</Label>
              <Input
                id="hydration-end"
                type="time"
                value={prefs.hydrationEndTime}
                onChange={(e) => setPrefs({ ...prefs, hydrationEndTime: e.target.value })}
                onBlur={(e) => void patch({ hydrationEndTime: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
