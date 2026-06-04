import type { AdminClient } from '../client.js'
import type { Database } from '../../../domain/database.types.js'
import type { Goal, GoalType } from '../../../domain/goal.js'
import { BotError } from '../../../domain/errors.js'

type GoalRow = Database['public']['Tables']['goals']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

function categoryName(categories: CategoryRow[], categoryId: string | null): string {
  if (!categoryId) return ''
  return categories.find((c) => c.id === categoryId)?.name ?? ''
}

function toGoal(row: GoalRow, categories: CategoryRow[]): Goal {
  const goal: Goal = {
    id: row.id,
    name: row.name,
    type: row.type as GoalType,
    targetValue: Number(row.target_value),
    currentValue: Number(row.current_value),
    deadline: new Date(row.deadline),
    categoryId: row.category_id,
    category: categoryName(categories, row.category_id),
    linkedHabitIds: row.linked_habit_ids ?? [],
    createdAt: new Date(row.created_at),
  }
  if (row.description) goal.description = row.description
  if (row.unit) goal.unit = row.unit
  return goal
}

export class GoalRepository {
  constructor(private readonly db: AdminClient) {}

  async listByUserId(userId: string): Promise<Goal[]> {
    const [goalsRes, categoriesRes] = await Promise.all([
      this.db.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      this.db.from('categories').select('*').eq('user_id', userId),
    ])
    if (goalsRes.error) throw new BotError('internal', goalsRes.error.message, { cause: goalsRes.error })
    if (categoriesRes.error) throw new BotError('internal', categoriesRes.error.message, { cause: categoriesRes.error })
    const categories = categoriesRes.data ?? []
    return (goalsRes.data ?? []).map((row) => toGoal(row, categories))
  }
}
