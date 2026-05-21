import Link from 'next/link'
import { Target, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { sortActiveGoals, type GoalSort } from '@/lib/dashboard-sort'
import { getDaysRemaining } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Goal } from '@/lib/types'

interface GoalMiniCardProps {
  goal: Goal
}

function GoalMiniCard({ goal }: GoalMiniCardProps) {
  const pct = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
  const daysLeft = getDaysRemaining(goal.deadline)
  const deadlineLabel = format(goal.deadline, 'd MMM yyyy', { locale: ru })

  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className="cursor-pointer border border-[var(--border)] shadow-none hover:bg-[var(--muted)]/35 dark:hover:bg-[var(--muted)]/45">
        <CardContent className="p-3.5">
          <div className="flex items-start gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              <Target className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{goal.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{goal.category}</p>
            </div>
          </div>
          <Progress value={pct} className="mb-2" />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span>
              {goal.currentValue}/{goal.targetValue} {goal.unit}
            </span>
            <span className={`flex items-center gap-1 ${daysLeft < 30 ? 'text-orange-500' : ''}`}>
              <Clock className="h-3 w-3 shrink-0" />
              {deadlineLabel}
              {daysLeft > 0 ? ` · ${daysLeft} дн.` : ' · просрочена'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface ActiveGoalCardsProps {
  goals: Goal[]
  sort?: GoalSort
}

export function ActiveGoalCards({ goals, sort = 'deadline-asc' }: ActiveGoalCardsProps) {
  const activeGoals = sortActiveGoals(goals, sort)

  if (activeGoals.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="Нет активных целей"
        description="Добавьте цель или откройте список всех целей — выполненные здесь не показываются."
        compact
        action={{ label: 'Перейти к целям', href: '/goals' }}
      />
    )
  }

  return (
    <div className="space-y-2">
      {activeGoals.map((goal) => (
        <GoalMiniCard key={goal.id} goal={goal} />
      ))}
    </div>
  )
}
