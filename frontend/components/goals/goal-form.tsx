'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { formFieldErrorClass, cn } from '@/lib/utils'
import type { Goal } from '@/lib/types'
import { goalFormSchema, type GoalFormInput } from '@/lib/validation/goals'

interface GoalFormProps {
  defaultValues?: Partial<Goal>
  onSubmit: (data: Omit<Goal, 'id' | 'createdAt' | 'currentValue'>) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function GoalForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Сохранить' }: GoalFormProps) {
  const { categories, habits } = useStore()
  const activeHabits = habits.filter((h) => !h.isArchived)
  const [linkedHabitIds, setLinkedHabitIds] = useState<string[]>(defaultValues?.linkedHabitIds ?? [])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<GoalFormInput>({
    resolver: zodResolver(goalFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: defaultValues?.name ?? '',
      targetValue: defaultValues?.targetValue ?? 10,
      unit: defaultValues?.unit ?? '',
      categoryId: defaultValues?.categoryId ?? '',
      deadline: defaultValues?.deadline ? new Date(defaultValues.deadline).toISOString().split('T')[0] : '',
    },
  })

  const toggleLinkedHabit = (habitId: string) => {
    setLinkedHabitIds((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    )
  }

  const handleFormSubmit = async (data: GoalFormInput) => {
    const cat = categories.find((c) => c.id === data.categoryId)
    if (!cat) return
    await onSubmit({
      name: data.name,
      description: undefined,
      type: 'numeric',
      targetValue: data.targetValue,
      unit: data.unit,
      categoryId: data.categoryId,
      category: cat.name,
      deadline: new Date(data.deadline),
      linkedHabitIds,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="goal-name">Название</Label>
        <Input
          id="goal-name"
          data-testid="goal-form-name"
          placeholder="Например: 10 книг за год"
          aria-invalid={!!errors.name}
          className={formFieldErrorClass(!!errors.name)}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-[var(--destructive)]">{errors.name.message}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[7rem] flex-1 space-y-1.5">
          <Label htmlFor="goal-target">На сколько</Label>
          <Input
            id="goal-target"
            type="number"
            data-testid="goal-form-target"
            min={1}
            step="any"
            aria-invalid={!!errors.targetValue}
            className={formFieldErrorClass(!!errors.targetValue)}
            {...register('targetValue', { valueAsNumber: true })}
          />
          {errors.targetValue && (
            <p className="text-xs text-[var(--destructive)]">{errors.targetValue.message}</p>
          )}
        </div>
        <div className="min-w-[5rem] w-28 space-y-1.5">
          <Label htmlFor="goal-unit">Ед.</Label>
          <Input
            id="goal-unit"
            placeholder="книг"
            data-testid="goal-form-unit"
            aria-invalid={!!errors.unit}
            className={formFieldErrorClass(!!errors.unit)}
            {...register('unit')}
          />
          {errors.unit && <p className="text-xs text-[var(--destructive)]">{errors.unit.message}</p>}
        </div>
        <div className="min-w-[10rem] flex-1 space-y-1.5">
          <Label htmlFor="goal-deadline">Дедлайн</Label>
          <Input
            id="goal-deadline"
            type="date"
            data-testid="goal-form-deadline"
            aria-invalid={!!errors.deadline}
            className={cn('w-full', formFieldErrorClass(!!errors.deadline))}
            {...register('deadline')}
          />
          {errors.deadline && <p className="text-xs text-[var(--destructive)]">{errors.deadline.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Категория</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                aria-invalid={!!errors.categoryId}
                className={formFieldErrorClass(!!errors.categoryId)}
                data-testid="goal-form-category-trigger"
              >
                <SelectValue placeholder={categories.length ? 'Выберите…' : 'Сначала создайте категорию в настройках'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoryId && <p className="text-xs text-[var(--destructive)]">{errors.categoryId.message}</p>}
        {categories.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Нет категорий. Создайте их в{' '}
            <a href="/settings" className="text-[var(--primary)] underline">
              настройках
            </a>
            .
          </p>
        )}
      </div>

      {activeHabits.length > 0 && (
        <div className="space-y-2" data-testid="goal-form-linked-habits">
          <Label>Связанные привычки</Label>
          <p className="text-xs text-[var(--muted-foreground)]">
            Отметки по этим привычкам помогут видеть прогресс рядом с целью
          </p>
          <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
            {activeHabits.map((habit) => {
              const checked = linkedHabitIds.includes(habit.id)
              return (
                <label
                  key={habit.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--accent)]"
                  data-testid={`goal-form-link-habit-${habit.id}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLinkedHabit(habit.id)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm">
                    {habit.icon} {habit.name}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" data-testid="goal-form-cancel">
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={!isValid || isSubmitting} data-testid="goal-form-submit">
          {isSubmitting ? 'Сохранение...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
