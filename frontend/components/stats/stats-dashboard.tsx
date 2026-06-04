'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Flame, BarChart2, CheckSquare, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { WeeklyActivityStrip } from '@/components/dashboard/weekly-activity-strip'
import { ActivityHeatmap } from '@/components/stats/activity-heatmap'
import { HabitRankList } from '@/components/stats/habit-rank-list'
import { RecapCard } from '@/components/stats/recap-card'
import { useStore } from '@/lib/store'
import {
  buildGlobalHeatmapDays,
  buildMonthlyRecap,
  buildWeeklyCompletionRates,
  buildWeeklyRecap,
  computeGlobalStats,
  rankHabitsByRate,
} from '@/lib/habit-analytics'

type PeriodKey = '7' | '30' | '90'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '7', label: 'Неделя' },
  { key: '30', label: 'Месяц' },
  { key: '90', label: '3 мес.' },
]

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: color + '20' }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsDashboard() {
  const { habits, habitLogs } = useStore()
  const [period, setPeriod] = useState<PeriodKey>('30')

  const active = habits.filter((h) => !h.isArchived)

  if (active.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="Пока нет привычек для аналитики"
        description="Добавьте хотя бы одну привычку — здесь появятся streaks, heatmap и обзоры."
        action={{ label: 'Добавить привычку', href: '/habits' }}
      />
    )
  }

  const global = computeGlobalStats(habits, habitLogs)
  const heatmapDays = buildGlobalHeatmapDays(habits, habitLogs, 365)
  const weeklyChart = buildWeeklyCompletionRates(habits, habitLogs, 12)
  const weeklyRecap = buildWeeklyRecap(habits, habitLogs)
  const monthlyRecap = buildMonthlyRecap(habits, habitLogs)
  const periodDays = period === '7' ? 7 : period === '30' ? 30 : 90
  const rankedForPeriod = rankHabitsByRate(habits, habitLogs, periodDays)
  const completionRate =
    period === '7'
      ? global.completionRate7
      : period === '30'
        ? global.completionRate30
        : global.completionRate90

  return (
    <div className="max-w-4xl space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Следите за регулярностью и находите слабые места
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-[var(--muted)]/40 p-1 self-start">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                period === p.key
                  ? 'bg-[var(--card)] shadow-sm text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Flame className="h-5 w-5" />}
          label="Серия идеальных дней"
          value={`${global.perfectDayStreak} дн.`}
          color="#f97316"
        />
        <MetricCard
          icon={<Trophy className="h-5 w-5" />}
          label="Лучший streak"
          value={`${global.bestHabitStreak} дн.`}
          color="#eab308"
        />
        <MetricCard
          icon={<BarChart2 className="h-5 w-5" />}
          label={`Выполнение за ${period === '7' ? '7' : period === '30' ? '30' : '90'} дн.`}
          value={`${completionRate}%`}
          color="#6366f1"
        />
        <MetricCard
          icon={<CheckSquare className="h-5 w-5" />}
          label="Активных привычек"
          value={global.activeHabits}
          color="#22c55e"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecapCard recap={weeklyRecap} />
        <RecapCard recap={monthlyRecap} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Последние 7 дней</CardTitle>
          <CardDescription>Доля выполненных привычек по дням</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyActivityStrip />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Heatmap активности</CardTitle>
          <CardDescription>365 дней — интенсивность по всем привычкам</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap days={heatmapDays} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Выполнение по неделям</CardTitle>
          <CardDescription>Последние 12 недель</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                {weeklyChart.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.pct >= 80 ? '#22c55e' : entry.pct >= 50 ? '#6366f1' : '#e2e8f0'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <HabitRankList
              habits={active}
              entries={rankedForPeriod.slice(0, 4)}
              title="Лучшие привычки"
              accentColor="#22c55e"
              showRank
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <HabitRankList
              habits={active}
              entries={[...rankedForPeriod].reverse().slice(0, 4)}
              title="Требуют внимания"
              accentColor="#f59e0b"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
