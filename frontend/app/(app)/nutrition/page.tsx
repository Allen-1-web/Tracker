'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NutritionSummary } from '@/components/nutrition/nutrition-summary'
import { QuickFoodLog } from '@/components/nutrition/quick-food-log'
import { MealsList } from '@/components/nutrition/meals-list'
import { NutritionGoalsForm } from '@/components/nutrition/nutrition-goals-form'
import { useStore } from '@/lib/store'

export default function NutritionPage() {
  const { mealEntries, nutritionGoals } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [goalsOpen, setGoalsOpen] = useState(false)

  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
  const todayEntries = mealEntries.filter((e) => e.date === dateStr)
  const dateLabel = isToday ? 'Сегодня' : format(currentDate, 'd MMMM', { locale: ru })

  return (
    <AppLayout title="Питание">
      <div className="max-w-2xl space-y-4 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() =>
                setCurrentDate((d) => {
                  const next = new Date(d)
                  next.setDate(next.getDate() - 1)
                  return next
                })
              }
              className="rounded-lg p-1.5 hover:bg-[var(--accent)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[120px] text-center font-semibold">{dateLabel}</span>
            <button
              type="button"
              onClick={() =>
                setCurrentDate((d) => {
                  const next = new Date(d)
                  next.setDate(next.getDate() + 1)
                  return next
                })
              }
              disabled={isToday}
              className="rounded-lg p-1.5 hover:bg-[var(--accent)] disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setGoalsOpen(true)}>
            <Settings2 className="mr-1.5 h-4 w-4" />
            Цели КБЖУ
          </Button>
        </div>

        <NutritionSummary entries={todayEntries} goals={nutritionGoals} compact />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Быстрый ввод</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickFoodLog date={dateStr} />
          </CardContent>
        </Card>

        {todayEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Сегодня съедено</CardTitle>
            </CardHeader>
            <CardContent>
              <MealsList entries={todayEntries} />
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Дневные цели КБЖУ</DialogTitle>
          </DialogHeader>
          <NutritionGoalsForm onClose={() => setGoalsOpen(false)} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
