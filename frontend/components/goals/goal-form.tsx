'use client'

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

/** Упрощённое создание: название, цель, категория и дата — без связей и лишних полей. */
export function GoalForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Сохранить' }: GoalFormProps) {
  const { categories } = useStore()

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
      linkedHabitIds: [],
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="goal-name">Название</Label>
        <Input
          id="goal-name"
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
          <Input id="goal-unit" placeholder="книг" aria-invalid={!!errors.unit} className={formFieldErrorClass(!!errors.unit)} {...register('unit')} />
          {errors.unit && <p className="text-xs text-[var(--destructive)]">{errors.unit.message}</p>}
        </div>
        <div className="min-w-[10rem] flex-1 space-y-1.5">
          <Label htmlFor="goal-deadline">Дедлайн</Label>
          <Input
            id="goal-deadline"
            type="date"
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
              <SelectTrigger aria-invalid={!!errors.categoryId} className={formFieldErrorClass(!!errors.categoryId)}>
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

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Сохранение...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
