'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HabitForm } from './habit-form'
import { useStore } from '@/lib/store'
import type { Habit } from '@/lib/types'

export function AddHabitModal() {
  const [open, setOpen] = useState(false)
  const { addHabit } = useStore()

  const handleSubmit = async (data: Omit<Habit, 'id' | 'createdAt'>) => {
    const ok = await addHabit(data)
    if (ok) setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="habits-add-open">
          <Plus className="h-4 w-4 mr-1" /> Добавить привычку
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая привычка</DialogTitle>
        </DialogHeader>
        <HabitForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} submitLabel="Создать" />
      </DialogContent>
    </Dialog>
  )
}
