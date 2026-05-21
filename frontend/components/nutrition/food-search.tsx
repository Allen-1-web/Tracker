'use client'

import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import type { FoodItem, MealType } from '@/lib/types'
import { cn, formFieldErrorClass } from '@/lib/utils'
import { mealEntryInsertSchema } from '@/lib/validation/meal-entries'
import { zodErrorsToFieldMap } from '@/lib/validation/errors'

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch',     label: 'Обед'    },
  { value: 'dinner',    label: 'Ужин'    },
  { value: 'snack',     label: 'Перекус' },
]

const CATEGORY_LABELS: Record<string, string> = {
  proteins:   'Белки',
  grains:     'Злаки',
  dairy:      'Молочка',
  vegetables: 'Овощи',
  fruits:     'Фрукты',
  fats:       'Жиры',
  drinks:     'Напитки',
  sweets:     'Сладкое',
  other:      'Прочее',
}

interface FoodSearchProps {
  date: string
}

export function FoodSearch({ date }: FoodSearchProps) {
  const { foodDatabase, addMealEntry } = useStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('100')
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [added, setAdded] = useState(false)
  const [amountError, setAmountError] = useState<string | null>(null)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return foodDatabase.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query, foodDatabase])

  function handleSelect(food: FoodItem) {
    setSelected(food)
    setQuery(food.name)
  }

  async function handleAdd() {
    if (!selected) return
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
      setAmountError(fields.amount?.[0] ?? fields.calories?.[0] ?? parsed.error.issues[0]?.message ?? 'Ошибка валидации')
      return
    }
    setAmountError(null)
    await addMealEntry(parsed.data)
    setAdded(true)
    setTimeout(() => {
      setSelected(null)
      setQuery('')
      setAmount('100')
      setAdded(false)
    }, 1200)
  }

  const preview = selected
    ? (() => {
        const g = parseFloat(amount.replace(',', '.')) || 0
        const f = g / 100
        return {
          calories: Math.round(selected.calories * f),
          protein:  Math.round(selected.protein  * f * 10) / 10,
          fat:      Math.round(selected.fat       * f * 10) / 10,
          carbs:    Math.round(selected.carbs     * f * 10) / 10,
        }
      })()
    : null

  const parsedAmount = parseFloat(amount.replace(',', '.'))
  const canAddMeal = !!selected && Number.isFinite(parsedAmount) && parsedAmount > 0

  return (
    <div className="space-y-4">
      {/* Search field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <Input
          className="pl-9"
          placeholder="Найти продукт… (курица, рис, яйцо)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
          }}
        />
      </div>

      {/* Dropdown results */}
      {results.length > 0 && !selected && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
          {results.map((food, i) => (
            <button
              key={food.id}
              onClick={() => handleSelect(food)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--accent)] transition-colors text-left',
                i !== 0 && 'border-t border-[var(--border)]'
              )}
            >
              <div>
                <span className="font-medium">{food.name}</span>
                <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                  {CATEGORY_LABELS[food.category]}
                </span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)] shrink-0 ml-3">
                {food.calories} ккал / 100г
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selected food form */}
      {selected && (
        <div className="border border-[var(--border)] rounded-lg p-4 space-y-4 bg-[var(--card)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{selected.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {selected.calories} ккал · Б {selected.protein}г · Ж {selected.fat}г · У {selected.carbs}г — на 100г
              </p>
            </div>
            <button
              onClick={() => { setSelected(null); setQuery('') }}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Количество (г)</label>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setAmountError(null)
                }}
                aria-invalid={!!amountError}
                className={formFieldErrorClass(!!amountError)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Приём пищи</label>
              <div className="grid grid-cols-2 gap-1">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    onClick={() => setMealType(mt.value)}
                    className={cn(
                      'text-xs px-2 py-1.5 rounded-md border transition-colors',
                      mealType === mt.value
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                    )}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {amountError && <p className="text-xs text-[var(--destructive)]">{amountError}</p>}

          {/* Preview */}
          {preview && (
            <div className="grid grid-cols-4 gap-2 text-center bg-[var(--accent)] rounded-lg py-2">
              {[
                { label: 'Калории', value: `${preview.calories} ккал` },
                { label: 'Белки',   value: `${preview.protein} г`    },
                { label: 'Жиры',    value: `${preview.fat} г`        },
                { label: 'Углеводы',value: `${preview.carbs} г`      },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            type="button"
            onClick={handleAdd}
            disabled={added || !canAddMeal}
          >
            {added ? '✓ Добавлено!' : (
              <><Plus className="h-4 w-4 mr-1" /> Добавить в дневник</>
            )}
          </Button>
        </div>
      )}

      {/* Empty hint */}
      {!query && !selected && (
        <p className="text-center text-sm text-[var(--muted-foreground)] py-6">
          Начните вводить название продукта
        </p>
      )}
    </div>
  )
}
