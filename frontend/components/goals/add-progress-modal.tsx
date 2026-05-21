'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/lib/store'
import { formFieldErrorClass } from '@/lib/utils'
import { createGoalProgressFormSchema } from '@/lib/validation/goal-progress'

interface AddProgressModalProps {
  goalId: string
  unit?: string
  currentValue: number
  targetValue: number
}

export function AddProgressModal({ goalId, unit, currentValue, targetValue }: AddProgressModalProps) {
  const [open, setOpen] = useState(false)
  const { addGoalProgress } = useStore()

  const schema = useMemo(() => createGoalProgressFormSchema(targetValue), [targetValue])

  const { register, handleSubmit, reset, formState: { errors, isValid, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { value: currentValue, note: '' },
  })

  const onSubmit = async (data: { value: number; note?: string }) => {
    await addGoalProgress({
      goalId,
      date: new Date(),
      value: data.value,
      note: data.note,
    })
    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1.5" /> Добавить прогресс
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Обновить прогресс</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Текущее значение {unit ? `(${unit})` : ''}</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              aria-invalid={!!errors.value}
              className={formFieldErrorClass(!!errors.value)}
              {...register('value', { valueAsNumber: true })}
            />
            {errors.value && <p className="text-xs text-[var(--destructive)]">{errors.value.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Заметка (необязательно)</Label>
            <Textarea
              placeholder="Например: Пробежал 5 км"
              aria-invalid={!!errors.note}
              className={formFieldErrorClass(!!errors.note)}
              {...register('note')}
            />
            {errors.note && <p className="text-xs text-[var(--destructive)]">{errors.note.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" className="flex-1" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
