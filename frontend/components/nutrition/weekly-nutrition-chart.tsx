'use client'

import { format, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { EmptyState } from '@/components/shared/empty-state'
import type { MealEntry, NutritionGoals } from '@/lib/types'

interface WeeklyNutritionChartProps {
  entries: MealEntry[]
  goals: NutritionGoals
}

export function WeeklyNutritionChart({ entries, goals }: WeeklyNutritionChartProps) {
  const data = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const dayEntries = entries.filter((e) => e.date === date)
    const calories = dayEntries.reduce((s, e) => s + e.calories, 0)
    const label = format(subDays(new Date(), 6 - i), 'EEE', { locale: ru })
    return { date, label: label.charAt(0).toUpperCase() + label.slice(1), calories }
  })

  const hasWeekData = data.some((d) => d.calories > 0)
  if (!hasWeekData) {
    return (
      <div className="flex min-h-[180px] items-center justify-center">
        <EmptyState
          icon="📊"
          title="Нет данных за неделю"
          description="Добавьте приёмы пищи за последние 7 дней — столбики появятся на графике."
          compact
          className="py-4"
        />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={28} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--accent)' }}
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [`${v ?? 0} ккал`, 'Калории']}
        />
        <ReferenceLine
          y={goals.calories}
          stroke="var(--primary)"
          strokeDasharray="4 4"
          label={{ value: 'Цель', position: 'insideTopRight', fontSize: 10, fill: 'var(--primary)' }}
        />
        <Bar
          dataKey="calories"
          fill="var(--primary)"
          radius={[6, 6, 0, 0]}
          opacity={0.85}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
