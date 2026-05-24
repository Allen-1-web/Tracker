export type HabitFrequency = 'daily' | number[] // number[] = дни недели 0-6

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  /** FK → categories.id */
  categoryId: string | null
  /** Имя категории для UI (резолвится при загрузке из categories) */
  category: string
  frequency: HabitFrequency
  createdAt: Date
  isArchived: boolean
}

export interface HabitLog {
  habitId: string
  date: string // 'YYYY-MM-DD'
  completed: boolean
}

export type GoalType = 'numeric' | 'binary'
/** Только для отображения; в БД отдельного поля status нет */
export type GoalStatus = 'active' | 'completed'

export interface Goal {
  id: string
  name: string
  description?: string
  type: GoalType
  targetValue: number
  currentValue: number
  unit?: string
  deadline: Date
  /** FK → categories.id */
  categoryId: string | null
  /** Имя категории для UI (резолвится при загрузке из categories) */
  category: string
  linkedHabitIds: string[]
  createdAt: Date
}

export interface GoalProgress {
  id: string
  goalId: string
  date: Date
  value: number
  note?: string
}

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  role: UserRole
  name: string
  email: string
  avatarUrl?: string
  telegramConnected: boolean
  telegramUsername?: string
  theme: 'light' | 'dark' | 'system'
  reminderTime?: string // 'HH:mm'
  remindersEnabled: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface HabitStats {
  habitId: string
  currentStreak: number
  bestStreak: number
  completionRate30: number
  completionRate90: number
  totalCompleted: number
}

export interface DayCompletion {
  date: string
  completed: number
  total: number
  pct: number
}

export interface GlobalHabitStats {
  activeHabits: number
  perfectDayStreak: number
  bestHabitStreak: number
  completionRate7: number
  completionRate30: number
  completionRate90: number
}

export interface HabitRankEntry {
  habitId: string
  rate: number
}

export interface HabitRecap {
  period: 'week' | 'month'
  completionRate: number
  previousCompletionRate: number
  delta: number
  perfectDays: number
  activeDays: number
  topHabits: HabitRankEntry[]
  weakHabits: HabitRankEntry[]
}

// ─── Nutrition / КБЖУ ────────────────────────────────────────────────────────

export type FoodCategory =
  | 'proteins'
  | 'grains'
  | 'dairy'
  | 'vegetables'
  | 'fruits'
  | 'fats'
  | 'drinks'
  | 'sweets'
  | 'other'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** Nutritional values are per 100 g / 100 ml */
export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  category: FoodCategory
}

/** A single logged food entry */
export interface MealEntry {
  id: string
  foodId: string
  date: string      // 'YYYY-MM-DD'
  mealType: MealType
  amount: number    // grams / ml
  // denormalised totals (computed from amount)
  calories: number
  protein: number
  fat: number
  carbs: number
}

/** User's daily macro targets */
export interface NutritionGoals {
  calories: number
  protein: number
  fat: number
  carbs: number
}

// ─── Telegram integration ────────────────────────────────────────────────────

export type ReminderKind =
  | 'habit'
  | 'goal'
  | 'nutrition'
  | 'water'
  | 'sleep'
  | 'workout'
  | 'custom'

export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'skipped_quiet_hours'
  | 'skipped_disabled'
  | 'skipped_blocked'

export interface TelegramUser {
  userId: string
  telegramChatId: number
  telegramUserId: number
  username: string | null
  firstName: string | null
  lastName: string | null
  languageCode: string | null
  /** IANA TZ name, e.g. 'Europe/Moscow' */
  timezone: string
  /** 'HH:mm:ss' or null */
  quietHoursStart: string | null
  quietHoursEnd: string | null
  isBlocked: boolean
  linkedAt: Date
  lastSeenAt: Date | null
}

export interface ReminderSchedule {
  id: string
  userId: string
  kind: ReminderKind
  /** Linked entity (habit_id / goal_id) when applicable */
  refId: string | null
  title: string
  message: string | null
  /** Standard 5-field cron expression, in the user's timezone */
  cron: string
  timezone: string
  enabled: boolean
  nextRunAt: Date | null
  lastRunAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreferences {
  userId: string
  dailySummary: boolean
  /** 'HH:mm' */
  dailySummaryTime: string
  weeklyReport: boolean
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  weeklyReportDow: number
  /** 'HH:mm' */
  weeklyReportTime: string
  hydration: boolean
  hydrationIntervalMinutes: number
  hydrationStartTime: string
  hydrationEndTime: string
  nutritionReminders: boolean
  habitReminders: boolean
  goalDeadlineReminders: boolean
  missedHabitAlerts: boolean
  updatedAt: Date
}

export interface NotificationLog {
  id: string
  userId: string
  reminderId: string | null
  kind: string
  channel: string
  status: NotificationStatus
  payload: unknown
  error: string | null
  attempt: number
  createdAt: Date
}

/** Bot conversation state stored per chat. */
export interface TelegramSessionState {
  flow?: string
  step?: string
  payload?: Record<string, unknown>
}
