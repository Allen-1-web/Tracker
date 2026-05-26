'use client'

import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import type { FoodItem, MealType } from '@/lib/types'
import { cn, formFieldErrorClass } from '@/lib/utils'
import { mealEntryInsertSchema } from '@/lib/validation/meal-entries'
import { zodErrorsToFieldMap } from '@/lib/validation/errors'

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch', label: 'Обед' },
  { value: 'dinner', label: 'Ужин' },
  { value: 'snack', label: 'Перекус' },
]

interface QuickFoodLogProps {
  date: string
}

export function QuickFoodLog({ date }: QuickFoodLogProps) {
  const { foodDatabase, addMealEntry } = useStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('100')
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [addedFlash, setAddedFlash] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foodDatabase.slice(0, 6)
    return foodDatabase.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query, foodDatabase])

  function pickFood(food: FoodItem) {
    setSelected(food)
    setQuery(food.name)
    setFieldError(null)
  }

  function resetForm() {
    setSelected(null)
    setQuery('')
    setAmount('100')
    setFieldError(null)
  }

  async function handleAdd() {
    if (!selected) {
      setFieldError('Выберите продукт из списка')
      return
    }
    const g = parseFloat(amount.replace(',', '.'))
    const factor = g / 100
    const payload = {
      foodId: selected.id,
      date,
      mealType,
      amount: g,
      calories: Math.round(selected.calories * factor),
      protein: Math.round(selected.protein * factor * 10) / 10,
      fat: Math.round(selected.fat * factor * 10) / 10,
      carbs: Math.round(selected.carbs * factor * 10) / 10,
      productName: selected.name,
    }
    const parsed = mealEntryInsertSchema.safeParse(payload)
    if (!parsed.success) {
      const fields = zodErrorsToFieldMap(parsed.error)
      setFieldError(fields.amount?.[0] ?? parsed.error.issues[0]?.message ?? 'Проверьте данные')
      return
    }
    setFieldError(null)
    await addMealEntry(parsed.data)
    setAddedFlash(true)
    setTimeout(() => {
      setAddedFlash(false)
      resetForm()
    }, 800)
  }

  const parsedAmount = parseFloat(amount.replace(',', '.'))
  const canAdd = !!selected && Number.isFinite(parsedAmount) && parsedAmount > 0

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          className="pl-9"
          data-testid="nutrition-food-query"
          placeholder="Продукт: курица, рис, яйцо…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (selected && e.target.value !== selected.name) setSelected(null)
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {results.map((food) => (
          <button
            key={food.id}
            type="button"
            onClick={() => pickFood(food)}
            data-testid="nutrition-food-chip"
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              selected?.id === food.id
                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'border-[var(--border)] hover:bg-[var(--accent)]'
            )}
          >
            {food.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-[var(--muted-foreground)]">Граммы</label>
          <Input
            type="number"
            min={1}
            data-testid="nutrition-amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setFieldError(null)
            }}
            aria-invalid={!!fieldError}
            className={formFieldErrorClass(!!fieldError)}
          />
        </div>
        <div className="flex flex-wrap gap-1 sm:pb-0.5">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.value}
              type="button"
              onClick={() => setMealType(mt.value)}
              data-testid={`nutrition-meal-${mt.value}`}
              className={cn(
                'rounded-md border px-2 py-1 text-xs',
                mealType === mt.value
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[var(--border)] text-[var(--muted-foreground)]'
              )}
            >
              {mt.label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto shrink-0"
          data-testid="nutrition-add"
          disabled={!canAdd || addedFlash}
          onClick={() => void handleAdd()}
        >
          {addedFlash ? '✓' : <><Plus className="mr-1 h-4 w-4" /> Добавить</>}
        </Button>
      </div>

      {fieldError && <p className="text-xs text-[var(--destructive)]">{fieldError}</p>}

      {selected && (
        <p className="text-xs text-[var(--muted-foreground)]">
          {selected.calories} ккал / 100г · Б {selected.protein} · Ж {selected.fat} · У {selected.carbs}
        </p>
      )}
    </div>
  )
}
