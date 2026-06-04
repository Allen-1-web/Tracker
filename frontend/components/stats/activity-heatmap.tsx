'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DayCompletion } from '@/lib/types'

const MONTHS_ABBR = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const DAY_LABELS = ['', 'Пн', '', 'Ср', '', 'Пт', '']

function pctColor(pct: number, total: number, color: string): string {
  if (total === 0) return '#f1f5f9'
  if (pct === 0) return '#e2e8f0'
  if (pct >= 100) return '#22c55e'
  if (pct >= 75) return color
  if (pct >= 50) return color + '99'
  return color + '60'
}

interface ActivityHeatmapProps {
  days: DayCompletion[]
  color?: string
}

export function ActivityHeatmap({ days, color = '#6366f1' }: ActivityHeatmapProps) {
  const firstDow = days.length > 0 ? new Date(days[0].date + 'T12:00:00').getDay() : 0
  const padded: (DayCompletion | null)[] = Array(firstDow === 0 ? 0 : firstDow).fill(null)
  padded.push(...days)

  const weeks: (DayCompletion | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  const monthLabels: { month: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstDay = week.find(Boolean)
    if (firstDay) {
      const m = new Date(firstDay.date + 'T12:00:00').getMonth()
      if (m !== lastMonth) {
        monthLabels.push({ month: MONTHS_ABBR[m], col: wi })
        lastMonth = m
      }
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-1 ml-8">
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.col === wi)
            return (
              <div key={wi} className="w-3 shrink-0">
                {label && (
                  <span className="text-[9px] text-[var(--muted-foreground)] whitespace-nowrap">
                    {label.month}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1">
          <div className="flex flex-col gap-1 mr-1">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 flex items-center">
                <span className="text-[9px] text-[var(--muted-foreground)] w-7 text-right">{label}</span>
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                const date = day ? new Date(day.date + 'T12:00:00') : null
                return (
                  <div
                    key={di}
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{
                      backgroundColor: day ? pctColor(day.pct, day.total, color) : 'transparent',
                    }}
                    title={
                      day && date
                        ? `${format(date, 'd MMMM', { locale: ru })}: ${day.completed}/${day.total} (${day.pct}%)`
                        : ''
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-1 justify-end">
          <span className="text-[10px] text-[var(--muted-foreground)]">Меньше</span>
          {['#f1f5f9', '#e2e8f0', color + '60', color + '99', '#22c55e'].map((c, i) => (
            <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-[var(--muted-foreground)]">100%</span>
        </div>
      </div>
    </div>
  )
}
