'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Archive, Trash2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { EmptyState } from '@/components/shared/empty-state'
import { HabitStatsRow } from '@/components/habits/habit-stats-row'
import { HabitHeatmap } from '@/components/habits/habit-heatmap'
import { HabitWeeklyChart } from '@/components/habits/habit-weekly-chart'
import { HabitHistory } from '@/components/habits/habit-history'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CategoryBadgeById } from '@/components/shared/category-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { computeHabitStats, getHabitLogsForRange } from '@/lib/habit-analytics'
import { format } from 'date-fns'

export default function HabitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { habits, toggleHabitLog, archiveHabit, deleteHabit, habitLogs } = useStore()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const habit = habits.find((h) => h.id === params.id)
  if (!habit) {
    return (
      <AppLayout title="Привычка не найдена">
        <EmptyState
          icon="🔍"
          title="Привычка не найдена"
          description="Возможно, она удалена или ссылка устарела."
          action={{ label: 'К списку привычек', href: '/habits' }}
        />
      </AppLayout>
    )
  }

  const stats = computeHabitStats(habit, habitLogs)
  const today = format(new Date(), 'yyyy-MM-dd')
  const completedToday = habitLogs.some((l) => l.habitId === habit.id && l.date === today && l.completed)
  const logs = getHabitLogsForRange(habit.id, 365, habitLogs)
  const recentLogs = getHabitLogsForRange(habit.id, 30, habitLogs)

  const frequencyLabel =
    habit.frequency === 'daily'
      ? 'Ежедневно'
      : Array.isArray(habit.frequency)
      ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
          .filter((_, i) => (habit.frequency as number[]).includes(i))
          .join(', ')
      : 'Ежедневно'

  return (
    <AppLayout title={habit.name}>
      <div className="max-w-4xl space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/habits">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl sm:h-14 sm:w-14 sm:text-2xl"
                style={{ backgroundColor: habit.color + '20' }}
              >
                {habit.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold break-words sm:text-2xl">{habit.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <CategoryBadgeById categoryId={habit.categoryId} fallbackName={habit.category} />
                  <span className="text-xs text-[var(--muted-foreground)]">{frequencyLabel}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-12">
            {!completedToday && (
              <Button onClick={() => void toggleHabitLog(habit.id)} className="min-w-0 flex-1 sm:flex-none">
                <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" /> Отметить
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => void archiveHabit(habit.id)}
              title="Архивировать"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              title="Удалить"
              className="text-[var(--destructive)] hover:text-[var(--destructive)]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {completedToday && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Сегодня выполнено!
          </div>
        )}

        {/* Stats */}
        {stats && <HabitStatsRow stats={stats} />}

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Активность за год</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <HabitHeatmap logs={logs} color={habit.color} />
          </CardContent>
        </Card>

        {/* Weekly chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Выполнение по неделям</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <HabitWeeklyChart logs={recentLogs} color={habit.color} />
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">История (последние 30 дней)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <HabitHistory logs={recentLogs} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить привычку?"
        description={`Привычка "${habit.name}" и все данные будут удалены безвозвратно.`}
        confirmLabel="Удалить"
        destructive
        onConfirm={() => {
          void deleteHabit(habit.id)
          router.push('/habits')
        }}
      />
    </AppLayout>
  )
}
