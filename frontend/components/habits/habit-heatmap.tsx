'use client'

import { subDays, format, startOfWeek, eachDayOfInterval } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { HabitLog } from '@/lib/types'

interface HabitHeatmapProps {
  logs: HabitLog[]
  color?: string
}

const MONTHS_ABBR = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const DAY_LABELS = ['', 'Пн', '', 'Ср', '', 'Пт', '']

export function HabitHeatmap({ logs, color = '#6366f1' }: HabitHeatmapProps) {
  const today = new Date()
  const startDate = subDays(today, 364)
  const days = eachDayOfInterval({ start: startDate, end: today })

  const logMap = new Map(logs.map((l) => [l.date, l.completed]))

  // Pad to full weeks
  const firstDow = startDate.getDay()
  const paddedDays: (Date | null)[] = Array(firstDow === 0 ? 0 : firstDow).fill(null)
  paddedDays.push(...days)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7))
  }

  // Month labels
  const monthLabels: { month: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstDay = week.find(Boolean)
    if (firstDay) {
      const m = (firstDay as Date).getMonth()
      if (m !== lastMonth) {
        monthLabels.push({ month: MONTHS_ABBR[m], col: wi })
        lastMonth = m
      }
    }
  })

  const getCellColor = (date: Date | null) => {
    if (!date) return 'transparent'
    const key = format(date, 'yyyy-MM-dd')
    const completed = logMap.get(key)
    if (completed === true) return color
    if (completed === false) return '#e2e8f0'
    return '#f1f5f9'
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        {/* Month labels */}
        <div className="flex gap-1 ml-8">
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.col === wi)
            return (
              <div key={wi} className="w-3 flex-shrink-0">
                {label && (
                  <span className="text-[9px] text-[var(--muted-foreground)] whitespace-nowrap">{label.month}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 flex items-center">
                <span className="text-[9px] text-[var(--muted-foreground)] w-7 text-right">{label}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                const dateStr = day ? format(day, 'yyyy-MM-dd') : ''
                const completed = day ? logMap.get(dateStr) : undefined
                return (
                  <div
                    key={di}
                    className="h-3 w-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getCellColor(day) }}
                    title={day ? `${format(day, 'd MMMM', { locale: ru })}: ${completed ? 'выполнено' : completed === false ? 'пропущено' : 'нет данных'}` : ''}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-1 justify-end">
          <span className="text-[10px] text-[var(--muted-foreground)]">Меньше</span>
          {['#f1f5f9', '#e2e8f0', color + '60', color + '99', color].map((c, i) => (
            <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-[var(--muted-foreground)]">Больше</span>
        </div>
      </div>
    </div>
  )
}
