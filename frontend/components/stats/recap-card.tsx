'use client'

import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HabitRecap } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RecapCardProps {
  recap: HabitRecap
}

const PERIOD_LABELS = {
  week: 'Недельный обзор',
  month: 'Месячный обзор',
} as const

export function RecapCard({ recap }: RecapCardProps) {
  const DeltaIcon =
    recap.delta > 0 ? TrendingUp : recap.delta < 0 ? TrendingDown : Minus
  const deltaColor =
    recap.delta > 0 ? 'text-green-600' : recap.delta < 0 ? 'text-amber-600' : 'text-[var(--muted-foreground)]'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{PERIOD_LABELS[recap.period]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold tabular-nums">{recap.completionRate}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">выполнение</p>
          </div>
          <div className={cn('flex items-center gap-1 text-sm font-medium', deltaColor)}>
            <DeltaIcon className="h-4 w-4" />
            <span className="tabular-nums">
              {recap.delta > 0 ? '+' : ''}
              {recap.delta}%
            </span>
            <span className="text-xs text-[var(--muted-foreground)] font-normal">к прошлому</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-[var(--muted)]/30 p-3">
            <p className="text-lg font-bold tabular-nums">{recap.perfectDays}</p>
            <p className="text-xs text-[var(--muted-foreground)]">идеальных дней</p>
          </div>
          <div className="rounded-lg bg-[var(--muted)]/30 p-3">
            <p className="text-lg font-bold tabular-nums">{recap.activeDays}</p>
            <p className="text-xs text-[var(--muted-foreground)]">дней с привычками</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
