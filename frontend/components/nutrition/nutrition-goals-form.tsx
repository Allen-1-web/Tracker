'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useStore } from '@/lib/store'
import { formFieldErrorClass } from '@/lib/utils'
import { nutritionGoalsSchema, type NutritionGoalsInput } from '@/lib/validation/nutrition-goals'

interface NutritionGoalsFormProps {
  onClose?: () => void
}

const fields: { key: keyof NutritionGoalsInput; label: string; unit: string; hint: string }[] = [
  { key: 'calories', label: 'Калории', unit: 'ккал', hint: 'Среднестатистическая норма: 1800–2500 ккал' },
  { key: 'protein', label: 'Белки', unit: 'г', hint: 'Рекомендуется 1.2–2 г на кг веса тела' },
  { key: 'fat', label: 'Жиры', unit: 'г', hint: 'Около 25–35% от суточной калорийности' },
  { key: 'carbs', label: 'Углеводы', unit: 'г', hint: 'Около 45–55% от суточной калорийности' },
]

export function NutritionGoalsForm({ onClose }: NutritionGoalsFormProps) {
  const { nutritionGoals, updateNutritionGoals } = useStore()
  const [justSaved, setJustSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<NutritionGoalsInput>({
    resolver: zodResolver(nutritionGoalsSchema),
    mode: 'onChange',
    defaultValues: {
      calories: nutritionGoals.calories,
      protein: nutritionGoals.protein,
      fat: nutritionGoals.fat,
      carbs: nutritionGoals.carbs,
    },
  })

  useEffect(() => {
    reset({
      calories: nutritionGoals.calories,
      protein: nutritionGoals.protein,
      fat: nutritionGoals.fat,
      carbs: nutritionGoals.carbs,
    })
  }, [
    nutritionGoals.calories,
    nutritionGoals.protein,
    nutritionGoals.fat,
    nutritionGoals.carbs,
    reset,
  ])

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => {
      setJustSaved(false)
      onClose?.()
    }, 900)
    return () => clearTimeout(t)
  }, [justSaved, onClose])

  const onValid = async (data: NutritionGoalsInput) => {
    await updateNutritionGoals(data)
    setJustSaved(true)
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
      {fields.map(({ key, label, unit, hint }) => (
        <div key={key} className="space-y-1">
          <Label htmlFor={`ng-${key}`}>
            {label} <span className="font-normal text-[var(--muted-foreground)]">({unit})</span>
          </Label>
          <Input
            id={`ng-${key}`}
            type="number"
            min="0"
            step={key === 'calories' ? '1' : '0.1'}
            aria-invalid={!!errors[key]}
            className={formFieldErrorClass(!!errors[key])}
            {...register(key, { valueAsNumber: true })}
          />
          {errors[key] && (
            <p className="text-xs text-[var(--destructive)]">{errors[key]?.message}</p>
          )}
          <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
        </div>
      ))}
      <Button type="submit" className="mt-2 w-full" disabled={justSaved || !isValid || isSubmitting}>
        {justSaved ? '✓ Сохранено!' : isSubmitting ? 'Сохранение...' : 'Сохранить цели'}
      </Button>
    </form>
  )
}
