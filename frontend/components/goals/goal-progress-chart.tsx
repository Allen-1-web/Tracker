'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { EmptyState } from '@/components/shared/empty-state'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { GoalProgress } from '@/lib/types'

interface GoalProgressChartProps {
  progressEntries: GoalProgress[]
  targetValue: number
  unit?: string
}

export function GoalProgressChart({ progressEntries, targetValue, unit = '' }: GoalProgressChartProps) {
  const data = progressEntries.map((p) => ({
    date: format(p.date, 'd MMM', { locale: ru }),
    value: p.value,
  }))

  if (data.length === 0) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <EmptyState
          icon="📉"
          title="Нет данных для графика"
          description="Как только появятся записи прогресса, здесь отобразится динамика."
          compact
          className="py-4"
        />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}${unit ? ' ' + unit : ''}`}
        />
        <Tooltip
          formatter={(value) => [`${value} ${unit}`, 'Прогресс']}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <ReferenceLine y={targetValue} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Цель', fontSize: 11, fill: '#22c55e' }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2.5}
          dot={{ fill: 'var(--primary)', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
