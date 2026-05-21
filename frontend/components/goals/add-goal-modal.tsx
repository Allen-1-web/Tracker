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
import { GoalForm } from './goal-form'
import { useStore } from '@/lib/store'
import type { Goal } from '@/lib/types'

export function AddGoalModal() {
  const [open, setOpen] = useState(false)
  const { addGoal } = useStore()

  const handleSubmit = async (data: Omit<Goal, 'id' | 'createdAt' | 'currentValue'>) => {
    const ok = await addGoal({ ...data, currentValue: 0 })
    if (ok) setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Добавить цель
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая цель</DialogTitle>
        </DialogHeader>
        <GoalForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} submitLabel="Создать" />
      </DialogContent>
    </Dialog>
  )
}
