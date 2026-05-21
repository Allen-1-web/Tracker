'use client'

import { Flame, Beef, Droplets, Wheat } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MacroBar } from './macro-bar'
import type { MealEntry, NutritionGoals } from '@/lib/types'

interface NutritionSummaryProps {
  entries: MealEntry[]
  goals: NutritionGoals
  /** Один компактный блок вместо двух карточек */
  compact?: boolean
}

export function NutritionSummary({ entries, goals, compact = false }: NutritionSummaryProps) {
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein:  acc.protein  + e.protein,
      fat:      acc.fat      + e.fat,
      carbs:    acc.carbs    + e.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  const calPct = goals.calories === 0 ? 0 : Math.round((totals.calories / goals.calories) * 100)

  const stats = [
    {
      label: 'Калории',
      value: totals.calories,
      goal: goals.calories,
      unit: 'ккал',
      icon: Flame,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Белки',
      value: Math.round(totals.protein * 10) / 10,
      goal: goals.protein,
      unit: 'г',
      icon: Beef,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
    },
    {
      label: 'Жиры',
      value: Math.round(totals.fat * 10) / 10,
      goal: goals.fat,
      unit: 'г',
      icon: Droplets,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-500',
    },
    {
      label: 'Углеводы',
      value: Math.round(totals.carbs * 10) / 10,
      goal: goals.carbs,
      unit: 'г',
      icon: Wheat,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
    },
  ]

  if (compact) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium">Калории</span>
            <span className="text-lg font-bold tabular-nums">
              {totals.calories}
              <span className="text-sm font-normal text-[var(--muted-foreground)]">
                {' '}
                / {goals.calories} ккал
              </span>
            </span>
          </div>
          <Progress value={Math.min(calPct, 100)} className="h-2" />
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-[var(--muted-foreground)]">Б</p>
              <p className="font-semibold tabular-nums">
                {Math.round(totals.protein * 10) / 10}/{goals.protein}г
              </p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">Ж</p>
              <p className="font-semibold tabular-nums">
                {Math.round(totals.fat * 10) / 10}/{goals.fat}г
              </p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">У</p>
              <p className="font-semibold tabular-nums">
                {Math.round(totals.carbs * 10) / 10}/{goals.carbs}г
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* SVG ring */}
            <div className="relative shrink-0">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="var(--accent)" strokeWidth="10" />
                <circle
                  cx="48" cy="48" r="40" fill="none"
                  stroke={calPct > 100 ? '#ef4444' : 'var(--primary)'}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(calPct, 100) / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold leading-none">{totals.calories}</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">ккал</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
              <p className="font-semibold text-[var(--foreground)]">Калории за сегодня</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Цель: {goals.calories} ккал · {calPct > 100 ? `перебор на ${totals.calories - goals.calories}` : `осталось ${goals.calories - totals.calories}`} ккал
              </p>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs text-[var(--muted-foreground)] sm:justify-start">
                {stats.slice(1).map((s) => (
                  <span key={s.label}>
                    <span className="font-medium text-[var(--foreground)]">{s.value}г</span> {s.label.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro bars */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <MacroBar
            label="Белки"
            current={Math.round(totals.protein * 10) / 10}
            goal={goals.protein}
            unit="г"
            color="bg-red-500"
            bgColor="bg-red-100"
          />
          <MacroBar
            label="Жиры"
            current={Math.round(totals.fat * 10) / 10}
            goal={goals.fat}
            unit="г"
            color="bg-yellow-400"
            bgColor="bg-yellow-100"
          />
          <MacroBar
            label="Углеводы"
            current={Math.round(totals.carbs * 10) / 10}
            goal={goals.carbs}
            unit="г"
            color="bg-blue-500"
            bgColor="bg-blue-100"
          />
        </CardContent>
      </Card>
    </div>
  )
}
