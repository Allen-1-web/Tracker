import type { AdminClient } from '../client.js'
import type { Database } from '../../../domain/database.types.js'
import type { Habit, HabitFrequency, HabitLog } from '../../../domain/habit.js'
import { BotError } from '../../../domain/errors.js'

type HabitRow = Database['public']['Tables']['habits']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

function categoryName(categories: CategoryRow[], categoryId: string | null): string {
  if (!categoryId) return ''
  return categories.find((c) => c.id === categoryId)?.name ?? ''
}

function toHabit(row: HabitRow, categories: CategoryRow[]): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    categoryId: row.category_id,
    category: categoryName(categories, row.category_id),
    frequency: row.frequency as HabitFrequency,
    createdAt: new Date(row.created_at),
    isArchived: row.is_archived,
  }
}

export class HabitRepository {
  constructor(private readonly db: AdminClient) {}

  async listByUserId(userId: string): Promise<Habit[]> {
    const [habitsRes, categoriesRes] = await Promise.all([
      this.db.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      this.db.from('categories').select('*').eq('user_id', userId),
    ])
    if (habitsRes.error) throw new BotError('internal', habitsRes.error.message, { cause: habitsRes.error })
    if (categoriesRes.error) {
      throw new BotError('internal', categoriesRes.error.message, { cause: categoriesRes.error })
    }
    const categories = categoriesRes.data ?? []
    return (habitsRes.data ?? []).map((row) => toHabit(row, categories))
  }

  async findById(userId: string, habitId: string): Promise<Habit | null> {
    const { data, error } = await this.db
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('id', habitId)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    if (!data) return null
    const { data: categories } = await this.db.from('categories').select('*').eq('user_id', userId)
    return toHabit(data, categories ?? [])
  }

  async listLogsByUserId(userId: string): Promise<HabitLog[]> {
    const { data, error } = await this.db.from('habit_logs').select('*').eq('user_id', userId)
    if (error) throw new BotError('internal', error.message, { cause: error })
    return (data ?? []).map((l) => ({
      habitId: l.habit_id,
      date: l.log_date,
      completed: l.completed,
    }))
  }

  /** Toggle check-in на дату (как frontend toggleHabitLog). */
  async toggleLog(userId: string, habitId: string, logDate: string): Promise<boolean> {
    const habit = await this.findById(userId, habitId)
    if (!habit) throw new BotError('not_found', 'Привычка не найдена')

    const { data: existing, error: findError } = await this.db
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('log_date', logDate)
      .maybeSingle()
    if (findError) throw new BotError('internal', findError.message, { cause: findError })

    if (existing) {
      const next = !existing.completed
      const { error } = await this.db
        .from('habit_logs')
        .update({ completed: next })
        .eq('habit_id', habitId)
        .eq('log_date', logDate)
      if (error) throw new BotError('internal', error.message, { cause: error })
      return next
    }

    const { error } = await this.db.from('habit_logs').insert({
      habit_id: habitId,
      user_id: userId,
      log_date: logDate,
      completed: true,
    })
    if (error) throw new BotError('internal', error.message, { cause: error })
    return true
  }
}
