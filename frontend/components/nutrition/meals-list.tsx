'use client'

import { Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { useStore } from '@/lib/store'
import type { MealEntry, MealType } from '@/lib/types'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Завтрак',
  lunch:     '☀️ Обед',
  dinner:    '🌙 Ужин',
  snack:     '🍎 Перекус',
}

interface MealsListProps {
  entries: MealEntry[]
}

export function MealsList({ entries }: MealsListProps) {
  const { foodDatabase, deleteMealEntry } = useStore()

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="🍽️"
        title="Приёмов пищи нет"
        description="Добавьте продукты через поиск выше — записи появятся здесь."
        compact
      />
    )
  }

  const grouped = MEAL_ORDER.reduce<Record<MealType, MealEntry[]>>(
    (acc, type) => {
      acc[type] = entries.filter((e) => e.mealType === type)
      return acc
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] }
  )

  return (
    <div className="space-y-5">
      {MEAL_ORDER.map((type) => {
        const group = grouped[type]
        if (group.length === 0) return null
        const groupKcal = group.reduce((s, e) => s + e.calories, 0)

        return (
          <div key={type}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{MEAL_LABELS[type]}</p>
              <span className="text-xs text-[var(--muted-foreground)]">{groupKcal} ккал</span>
            </div>
            <div className="space-y-1">
              {group.map((entry) => {
                const food = foodDatabase.find((f) => f.id === entry.foodId)
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 bg-[var(--accent)] group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {food?.name ?? 'Неизвестный продукт'}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {entry.amount}г · Б {entry.protein}г · Ж {entry.fat}г · У {entry.carbs}г
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-sm font-semibold">{entry.calories} ккал</span>
                      <button
                        onClick={() => void deleteMealEntry(entry.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted-foreground)] hover:text-red-500"
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
