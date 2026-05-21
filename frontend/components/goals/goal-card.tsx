import Link from 'next/link'
import { Clock, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CategoryBadgeById } from '@/components/shared/category-badge'
import { getDaysRemaining } from '@/lib/utils'
import type { Goal } from '@/lib/types'

interface GoalCardProps {
  goal: Goal
  linkedHabitIcons?: string[]
}

export function GoalCard({ goal, linkedHabitIcons = [] }: GoalCardProps) {
  const pct = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
  const daysLeft = getDaysRemaining(goal.deadline)
  const isOverdue = daysLeft < 0
  const isAlmostDone = pct >= 80

  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className="h-full cursor-pointer border-0 bg-transparent shadow-none hover:bg-[var(--muted)]/35 dark:hover:bg-[var(--muted)]/45">
        <CardContent className="p-3.5 flex flex-col gap-2 h-full">
          {/* Header */}
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              <Target className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--foreground)] line-clamp-2">{goal.name}</p>
              <CategoryBadgeById categoryId={goal.categoryId} fallbackName={goal.category} className="mt-1" />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1 flex-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {goal.currentValue}/{goal.targetValue} {goal.unit}
              </span>
              <span className={`font-semibold ${isAlmostDone ? 'text-green-600' : 'text-[var(--primary)]'}`}>
                {pct}%
              </span>
            </div>
            <Progress value={pct} indicatorColor={isAlmostDone ? '#22c55e' : undefined} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : daysLeft <= 30 ? 'text-orange-500' : 'text-[var(--muted-foreground)]'}`}>
              <Clock className="h-3.5 w-3.5" />
              {isOverdue ? `Просрочена на ${Math.abs(daysLeft)} дн.` : `${daysLeft} дн. осталось`}
            </div>
            {linkedHabitIcons.length > 0 && (
              <div className="flex gap-1">
                {linkedHabitIcons.slice(0, 3).map((icon, i) => (
                  <span key={i} className="text-sm">{icon}</span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
