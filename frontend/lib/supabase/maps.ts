import { parseISO } from 'date-fns'
import type { SupabaseClient, User as AuthUser } from '@supabase/supabase-js'
import type {
  Category,
  FoodItem,
  Goal,
  GoalProgress,
  Habit,
  HabitLog,
  MealEntry,
  NutritionGoals,
  User,
} from '@/lib/types'
import type { Database, UserRole } from './database.types'

type Db = SupabaseClient<Database>

function parseRole(value: string | null | undefined): UserRole {
  return value === 'admin' ? 'admin' : 'user'
}

function categoryNameById(categories: Category[], categoryId: string | null): string {
  if (!categoryId) return ''
  return categories.find((c) => c.id === categoryId)?.name ?? ''
}

function mapProfile(
  row: Database['public']['Tables']['profiles']['Row'] | null,
  authUser: AuthUser
): User {
  return {
    id: row?.id ?? authUser.id,
    role: parseRole(row?.role),
    name: row?.name ?? authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? '',
    email: row?.email ?? authUser.email ?? '',
    avatarUrl: row?.avatar_url ?? undefined,
    telegramConnected: row?.telegram_connected ?? false,
    telegramUsername: row?.telegram_username ?? undefined,
    theme: (row?.theme as User['theme']) ?? 'light',
    reminderTime: row?.reminder_time ?? undefined,
    remindersEnabled: row?.reminders_enabled ?? true,
  }
}

export type UserAppData = {
  user: User
  habits: Habit[]
  habitLogs: HabitLog[]
  goals: Goal[]
  goalProgress: GoalProgress[]
  categories: Category[]
  foodDatabase: FoodItem[]
  mealEntries: MealEntry[]
  nutritionGoals: NutritionGoals
}

export async function fetchUserAppData(
  supabase: Db,
  userId: string,
  authUser: AuthUser
): Promise<UserAppData> {
  const [
    profileRes,
    categoriesRes,
    habitsRes,
    logsRes,
    goalsRes,
    progressRes,
    foodRes,
    mealsRes,
    nutritionRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('categories').select('*').eq('user_id', userId).order('name'),
    supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('habit_logs').select('*').eq('user_id', userId),
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('goal_progress').select('*').eq('user_id', userId).order('progress_date', { ascending: false }),
    supabase.from('food_items').select('*').order('name'),
    supabase.from('meal_entries').select('*').eq('user_id', userId).order('entry_date', { ascending: false }),
    supabase.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const firstError =
    profileRes.error ??
    categoriesRes.error ??
    habitsRes.error ??
    logsRes.error ??
    goalsRes.error ??
    progressRes.error ??
    foodRes.error ??
    mealsRes.error ??
    nutritionRes.error
  if (firstError) throw new Error(firstError.message)

  const categories: Category[] = (categoriesRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon,
  }))

  const habits: Habit[] = (habitsRes.data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color,
    categoryId: h.category_id,
    category: categoryNameById(categories, h.category_id),
    frequency: h.frequency as Habit['frequency'],
    createdAt: parseISO(h.created_at),
    isArchived: h.is_archived,
  }))

  const habitLogs: HabitLog[] = (logsRes.data ?? []).map((l) => ({
    habitId: l.habit_id,
    date: l.log_date,
    completed: l.completed,
  }))

  const goals: Goal[] = (goalsRes.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description ?? undefined,
    type: g.type as Goal['type'],
    targetValue: Number(g.target_value),
    currentValue: Number(g.current_value),
    unit: g.unit ?? undefined,
    deadline: parseISO(g.deadline),
    categoryId: g.category_id,
    category: categoryNameById(categories, g.category_id),
    linkedHabitIds: g.linked_habit_ids ?? [],
    createdAt: parseISO(g.created_at),
  }))

  const goalProgress: GoalProgress[] = (progressRes.data ?? []).map((p) => ({
    id: p.id,
    goalId: p.goal_id,
    date: parseISO(p.progress_date),
    value: Number(p.value),
    note: p.note ?? undefined,
  }))

  const foodDatabase: FoodItem[] = (foodRes.data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    calories: Number(f.calories),
    protein: Number(f.protein),
    fat: Number(f.fat),
    carbs: Number(f.carbs),
    category: f.category as FoodItem['category'],
  }))

  const mealEntries: MealEntry[] = (mealsRes.data ?? []).map((m) => ({
    id: m.id,
    foodId: m.food_id,
    date: m.entry_date,
    mealType: m.meal_type as MealEntry['mealType'],
    amount: Number(m.amount),
    calories: Number(m.calories),
    protein: Number(m.protein),
    fat: Number(m.fat),
    carbs: Number(m.carbs),
  }))

  const ng = nutritionRes.data
  const nutritionGoals: NutritionGoals = ng
    ? {
        calories: Number(ng.calories),
        protein: Number(ng.protein),
        fat: Number(ng.fat),
        carbs: Number(ng.carbs),
      }
    : { calories: 2200, protein: 150, fat: 70, carbs: 250 }

  return {
    user: mapProfile(profileRes.data, authUser),
    habits,
    habitLogs,
    goals,
    goalProgress,
    categories,
    foodDatabase,
    mealEntries,
    nutritionGoals,
  }
}

export type AdminProfileRow = {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  updatedAt: string
}

export async function fetchAdminProfiles(supabase: Db): Promise<AdminProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: parseRole(p.role),
    updatedAt: p.updated_at,
  }))
}
