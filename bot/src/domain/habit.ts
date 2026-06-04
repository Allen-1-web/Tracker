export type HabitFrequency = 'daily' | number[]

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  categoryId: string | null
  category: string
  frequency: HabitFrequency
  createdAt: Date
  isArchived: boolean
}

export interface HabitLog {
  habitId: string
  date: string
  completed: boolean
}

export interface TodayHabitItem {
  habit: Habit
  completed: boolean
}
