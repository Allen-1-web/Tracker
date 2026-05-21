'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { subWeeks, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { HabitLog } from '@/lib/types'

interface HabitWeeklyChartProps {
  logs: HabitLog[]
  color?: string
}

export function HabitWeeklyChart({ logs, color = '#6366f1' }: HabitWeeklyChartProps) {
  const logMap = new Map(logs.map((l) => [l.date, l.completed]))

  const data = Array.from({ length: 12 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 11 - i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd <= new Date() ? weekEnd : new Date() })
    const total = days.length
    const completed = days.filter((d) => logMap.get(format(d, 'yyyy-MM-dd')) === true).length
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
    return {
      week: format(weekStart, 'd MMM', { locale: ru }),
      pct,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Выполнение']}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.pct >= 80 ? '#22c55e' : entry.pct >= 50 ? color : '#e2e8f0'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
