'use client'

import { Suspense, useState } from 'react'
import { Search } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { HabitCard } from '@/components/habits/habit-card'
import { AddHabitModal } from '@/components/habits/add-habit-modal'
import { EmptyState } from '@/components/shared/empty-state'
import { ListSummaryLineSkeleton } from '@/components/shared/list-load-state'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStore } from '@/lib/store'
import { computeHabitStats } from '@/lib/habit-analytics'
import { format } from 'date-fns'

type Filter = 'all' | 'active' | 'archived'

function HabitsPageInner() {
  const { habits, toggleHabitLog, habitLogs } = useStore()
  const [filter, setFilter] = useState<Filter>('active')
  const [search, setSearch] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')

  const isCompletedToday = (habitId: string) =>
    habitLogs.some((l) => l.habitId === habitId && l.date === today && l.completed)

  const filtered = habits.filter((h) => {
    if (filter === 'active' && h.isArchived) return false
    if (filter === 'archived' && !h.isArchived) return false
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppLayout title="Привычки">
      <div className="max-w-4xl space-y-4 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full min-w-0 overflow-x-auto pb-0.5">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="w-max max-w-full">
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="active">Активные</TabsTrigger>
                <TabsTrigger value="archived">Архив</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex w-full min-w-0 gap-2 sm:w-auto sm:max-w-none sm:shrink-0">
            <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Поиск привычек..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <AddHabitModal />
          </div>
        </div>

        <div className="flex gap-3 text-sm text-[var(--muted-foreground)]">
          <span>{habits.filter((h) => !h.isArchived).length} активных</span>
          <span>·</span>
          <span>
            {
              habits.filter((h) => {
                if (h.isArchived) return false
                return isCompletedToday(h.id)
              }).length
            }{' '}
            выполнено сегодня
          </span>
        </div>

        {filtered.length === 0 ? (
          habits.length === 0 ? (
            <EmptyState
              icon="✨"
              title="Нет привычек"
              description="Добавьте первую привычку, чтобы начать"
            />
          ) : search ? (
            <EmptyState
              icon="🔍"
              title="Ничего не найдено"
              description="Попробуйте другой запрос или сбросьте поиск."
            />
          ) : (
            <EmptyState
              icon="📂"
              title="Нет привычек по фильтру"
              description="В этом разделе пусто — переключите фильтр или добавьте новую привычку."
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                stats={computeHabitStats(habit, habitLogs)}
                completedToday={isCompletedToday(habit.id)}
                onToggle={() => void toggleHabitLog(habit.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function HabitsPageFallback() {
  return (
    <AppLayout title="Привычки">
      <div className="max-w-4xl space-y-4 min-w-0">
        <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--muted)] sm:max-w-md" />
        <ListSummaryLineSkeleton />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-[var(--muted)]" />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export default function HabitsPage() {
  return (
    <Suspense fallback={<HabitsPageFallback />}>
      <HabitsPageInner />
    </Suspense>
  )
}
