'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting'
import { DailyProgressDashboard } from '@/components/dashboard/daily-progress-dashboard'
import { TodayHabitList } from '@/components/dashboard/today-habit-list'
import { ActiveGoalCards } from '@/components/dashboard/active-goal-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { motivationalQuotes } from '@/lib/quotes'

export default function DashboardPage() {
  const { user, goals } = useStore()
  const quote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length]

  return (
    <AppLayout title="Дашборд">
      <div className="max-w-4xl space-y-4 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <DashboardGreeting name={user.name} quote={quote} />
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/nutrition">+ Еда</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/habits">
                <Plus className="h-4 w-4 mr-1" /> Привычка
              </Link>
            </Button>
          </div>
        </div>

        <DailyProgressDashboard />

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Привычки на сегодня</CardTitle>
              <Link href="/habits" className="text-xs text-[var(--primary)] hover:underline">
                Все →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <TodayHabitList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Активные цели</CardTitle>
              <Link href="/goals" className="text-xs text-[var(--primary)] hover:underline">
                Все →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="min-w-0">
            <ActiveGoalCards goals={goals} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
