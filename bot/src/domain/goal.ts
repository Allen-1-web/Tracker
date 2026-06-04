export type GoalType = 'numeric' | 'binary'

export interface Goal {
  id: string
  name: string
  description?: string
  type: GoalType
  targetValue: number
  currentValue: number
  unit?: string
  deadline: Date
  categoryId: string | null
  category: string
  linkedHabitIds: string[]
  createdAt: Date
}

export interface GoalListItem {
  goal: Goal
  progressPercent: number
  isCompleted: boolean
}
