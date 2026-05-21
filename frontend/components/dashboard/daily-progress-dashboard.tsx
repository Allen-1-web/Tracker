'use client'

import Link from 'next/link'
import { CheckCircle2, Flame, Target, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { buildDailyDashboard } from '@/lib/daily-dashboard'
import { useStore } from '@/lib/store'

function MacroLine({
  label,
  current,
  goal,
  unit,
  percent,
}: {
  label: string
  current: number
  goal: number
  unit: string
  percent: number
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--muted-foreground)]">{label}</span>
        <span className="font-medium tabular-nums">
          {current}
          {unit} / {goal}
          {unit}
        </span>
      </div>
      <Progress value={Math.min(percent, 100)} className="h-1.5" />
    </div>
  )
}

export function DailyProgressDashboard() {
  const { habits, habitLogs, goals, mealEntries, nutritionGoals } = useStore()
  const day = buildDailyDashboard(habits, habitLogs, goals, mealEntries, nutritionGoals)

  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Прогресс дня</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg bg-[var(--muted)]/25 p-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--muted-foreground)]">Привычки</p>
              <p className="text-lg font-bold tabular-nums">
                {day.habits.completed}/{day.habits.total}
              </p>
              <Progress value={day.habits.percent} className="mt-2 h-1.5" />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{day.habits.percent}%</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-[var(--muted)]/25 p-3">
            <Flame className="h-5 w-5 shrink-0 text-orange-500" />
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Серия</p>
              <p className="text-lg font-bold tabular-nums">{day.habits.bestStreak} дн.</p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">лучшая активная</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-[var(--muted)]/25 p-3">
            <Target className="h-5 w-5 shrink-0 text-[var(--primary)]" />
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Цели</p>
              <p className="text-lg font-bold tabular-nums">{day.goals.averageProgress}%</p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                {day.goals.count} активных
              </p>
            </div>
          </div>
        </div>

        {day.goals.items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Цели на сегодня</p>
            {day.goals.items.map((g) => (
              <Link
                key={g.id}
                href={`/goals/${g.id}`}
                className="block rounded-md border border-[var(--border)]/80 px-3 py-2 hover:bg-[var(--muted)]/30"
              >
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{g.name}</span>
                  <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
                    {g.current}/{g.target} {g.unit ?? ''}
                  </span>
                </div>
                <Progress value={g.percent} className="mt-1.5 h-1" />
              </Link>
            ))}
          </div>
        )}

        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
              КБЖУ
            </span>
            <Link href="/nutrition" className="text-xs text-[var(--primary)] hover:underline">
              Добавить еду →
            </Link>
          </div>
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{day.nutrition.calories}</span>
            <span className="text-[var(--muted-foreground)]">
              {' '}
              / {day.nutrition.goals.calories} ккал ({day.nutrition.caloriePercent}%)
            </span>
          </p>
          <div className="grid gap-2">
            <MacroLine
              label="Белки"
              current={Math.round(day.nutrition.protein * 10) / 10}
              goal={day.nutrition.goals.protein}
              unit="г"
              percent={day.nutrition.proteinPercent}
            />
            <MacroLine
              label="Жиры"
              current={Math.round(day.nutrition.fat * 10) / 10}
              goal={day.nutrition.goals.fat}
              unit="г"
              percent={day.nutrition.fatPercent}
            />
            <MacroLine
              label="Углеводы"
              current={Math.round(day.nutrition.carbs * 10) / 10}
              goal={day.nutrition.goals.carbs}
              unit="г"
              percent={day.nutrition.carbsPercent}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
