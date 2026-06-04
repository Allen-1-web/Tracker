import type { GoalRepository } from '../../infrastructure/supabase/repositories/goal.repository.js'
import type { GoalListItem } from '../../domain/goal.js'

export class GoalService {
  constructor(private readonly goals: GoalRepository) {}

  async listActive(userId: string): Promise<GoalListItem[]> {
    const all = await this.goals.listByUserId(userId)
    return all
      .map((goal) => {
        const isCompleted = goal.currentValue >= goal.targetValue
        const progressPercent = isCompleted
          ? 100
          : Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 99)
        return { goal, progressPercent, isCompleted }
      })
      .filter((item) => !item.isCompleted)
  }
}
