'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Clock } from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { EmptyState } from '@/components/shared/empty-state'
import { GoalProgressChart } from '@/components/goals/goal-progress-chart'
import { LinkedHabitsList } from '@/components/goals/linked-habits-list'
import { ProgressFeed } from '@/components/goals/progress-feed'
import { AddProgressModal } from '@/components/goals/add-progress-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CategoryBadgeById } from '@/components/shared/category-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/lib/store'
import { computeAllHabitStats } from '@/lib/habit-analytics'
import { getDaysRemaining, formatDate } from '@/lib/utils'

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { goals, habits, goalProgress, deleteGoal, habitLogs } = useStore()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const goal = goals.find((g) => g.id === params.id)
  if (!goal) {
    return (
      <AppLayout title="Цель не найдена">
        <EmptyState
          icon="🔍"
          title="Цель не найдена"
          description="Возможно, она удалена или ссылка устарела."
          action={{ label: 'К списку целей', href: '/goals' }}
        />
      </AppLayout>
    )
  }

  const pct = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
  const daysLeft = getDaysRemaining(goal.deadline)
  const isOverdue = daysLeft < 0
  const isCompleted = pct >= 100

  const linkedHabits = habits.filter((h) => goal.linkedHabitIds.includes(h.id))
  const linkedHabitStats = computeAllHabitStats(linkedHabits, habitLogs)
  const goalProgressEntries = goalProgress.filter((p) => p.goalId === goal.id)

  return (
    <AppLayout title={goal.name}>
      <div className="max-w-4xl space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/goals">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold break-words sm:text-2xl">{goal.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <CategoryBadgeById categoryId={goal.categoryId} fallbackName={goal.category} />
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : isCompleted ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {isCompleted ? 'Выполнено!' : isOverdue ? `Просрочена на ${Math.abs(daysLeft)} дн.` : `${daysLeft} дней осталось`}
                </span>
                <span className="text-[var(--muted-foreground)]">Дедлайн: {formatDate(goal.deadline)}</span>
              </div>
              {goal.description && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{goal.description}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
            <AddProgressModal
              goalId={goal.id}
              unit={goal.unit}
              currentValue={goal.currentValue}
              targetValue={goal.targetValue}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              className="text-[var(--destructive)]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Big progress */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-3xl font-bold sm:text-4xl">
                  {goal.currentValue}
                  <span className="text-lg text-[var(--muted-foreground)] ml-1">{goal.unit}</span>
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  из {goal.targetValue} {goal.unit}
                </p>
              </div>
              <p className={`text-2xl font-bold sm:text-3xl ${isCompleted ? 'text-green-600' : 'text-[var(--primary)]'}`}>
                {pct}%
              </p>
            </div>
            <Progress
              value={pct}
              className="h-4"
              indicatorColor={isCompleted ? '#22c55e' : isOverdue ? '#ef4444' : undefined}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 min-w-0 lg:grid-cols-5 lg:gap-6">
          {/* Chart */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Прогресс по времени</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <GoalProgressChart
                progressEntries={goalProgressEntries}
                targetValue={goal.targetValue}
                unit={goal.unit}
              />
            </CardContent>
          </Card>

          {/* Linked habits */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Связанные привычки</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <LinkedHabitsList habits={linkedHabits} stats={linkedHabitStats} />
            </CardContent>
          </Card>
        </div>

        {/* Progress feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Лента прогресса</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ProgressFeed entries={goalProgressEntries} unit={goal.unit} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить цель?"
        description={`Цель "${goal.name}" будет удалена безвозвратно.`}
        confirmLabel="Удалить"
        destructive
        onConfirm={() => {
          void deleteGoal(goal.id)
          router.push('/goals')
        }}
      />
    </AppLayout>
  )
}
