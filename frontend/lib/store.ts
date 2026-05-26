'use client'

import { create } from 'zustand'
import { format } from 'date-fns'
import type { Session } from '@supabase/supabase-js'
import type {
  Habit,
  HabitLog,
  Goal,
  GoalProgress,
  User,
  Category,
  FoodItem,
  MealEntry,
  NutritionGoals,
} from './types'
import { requireSessionForMutation, requireAdmin } from './auth/guards'
import { logSecurityEvent } from './auth/security-log'
import { getSupabaseBrowserClient } from './supabase/client'
import { fetchAdminProfiles, fetchUserAppData, type AdminProfileRow } from './supabase/maps'
import { postAuthAction } from './auth/auth-api'
import { applyClientApiError, finalizeClientApiError, redirectToLogin } from './auth/apply-api-error'
import { toApiError, type ApiErrorResponse } from './errors/api-error'
import type { UserRole } from './auth/roles'
import { insertWithCategoryFallback, isMissingCategoryIdColumn } from './supabase/category-write'
import type { Database } from './supabase/database.types'
import { withTimeout } from './supabase/with-timeout'
import {
  applyValidationFailure,
  toLogDate,
  validateCategoryCreate,
  validateGoalCreate,
  validateGoalProgressInsert,
  validateGoalUpdate,
  validateHabitCreate,
  validateHabitLogInsert,
  validateHabitUpdate,
  validateMealEntryInsert,
  validateNutritionGoalsUpdate,
  validateProfilePatch,
} from './validation/mutations'

type DataStatus = 'idle' | 'loading' | 'ready' | 'error'

const SUPABASE_AUTH_TIMEOUT_MS = 30_000
const SUPABASE_DATA_TIMEOUT_MS = 35_000

const defaultNutrition: NutritionGoals = {
  calories: 2200,
  protein: 150,
  fat: 70,
  carbs: 250,
}

const emptyUser: User = {
  id: '',
  role: 'user',
  name: '',
  email: '',
  telegramConnected: false,
  theme: 'light',
  remindersEnabled: false,
}

function getClient() {
  return getSupabaseBrowserClient()
}

function mutationErrorHandlers(
  set: (partial: Partial<AppStore>) => void,
  get: () => AppStore
) {
  return {
    hasSession: Boolean(get().session?.user),
    onShowError: (err: ApiErrorResponse) => set({ dataError: err }),
    onUnauthorized: () => {
      void get().forceSignOutRedirect()
    },
  }
}

function handleMutationError(
  set: (partial: Partial<AppStore>) => void,
  get: () => AppStore,
  error: unknown,
  fallback?: string
): ApiErrorResponse {
  return applyClientApiError(error, mutationErrorHandlers(set, get), fallback)
}

interface AppStore {
  session: Session | null
  authReady: boolean
  dataStatus: DataStatus
  dataError: ApiErrorResponse | null

  user: User
  habits: Habit[]
  habitLogs: HabitLog[]
  goals: Goal[]
  goalProgress: GoalProgress[]
  categories: Category[]
  foodDatabase: FoodItem[]
  mealEntries: MealEntry[]
  nutritionGoals: NutritionGoals

  initialize: () => Promise<void>
  reloadAppData: (opts?: { withLoading?: boolean }) => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: ApiErrorResponse }>
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error?: ApiErrorResponse; needsEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  /** 401: сброс сессии и переход на /login */
  forceSignOutRedirect: () => Promise<void>

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<boolean>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  archiveHabit: (id: string) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  toggleHabitLog: (habitId: string, date?: string) => Promise<void>

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<boolean>
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  addGoalProgress: (progress: Omit<GoalProgress, 'id'>) => Promise<void>

  updateUser: (updates: Partial<User>) => Promise<void>

  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  addMealEntry: (entry: Omit<MealEntry, 'id'>) => Promise<void>
  deleteMealEntry: (id: string) => Promise<void>
  updateNutritionGoals: (goals: Partial<NutritionGoals>) => Promise<void>

  /** Сброс текста мутационной ошибки (баннер в приложении). */
  clearDataError: () => void

  adminProfiles: AdminProfileRow[]
  loadAdminProfiles: () => Promise<void>
  setUserRole: (userId: string, role: UserRole) => Promise<{ error?: ApiErrorResponse }>
}

let authListenerAttached = false

async function runReloadAppData(
  set: (partial: Partial<AppStore>) => void,
  get: () => AppStore,
  opts?: { withLoading?: boolean }
): Promise<void> {
  const withLoading = opts?.withLoading ?? false
  const session = get().session
  if (!session?.user) return
  try {
    const supabase = getClient()
    if (withLoading) set({ dataStatus: 'loading', dataError: null })
    const data = await withTimeout(
      fetchUserAppData(supabase, session.user.id, session.user),
      SUPABASE_DATA_TIMEOUT_MS,
      'Превышено время ожидания ответа от базы. Проверьте интернет, что проект Supabase не на паузе и что SUPABASE_URL без /rest/v1.'
    )
    set({ ...data, dataStatus: 'ready', dataError: null })
  } catch (e) {
    set({
      dataStatus: 'error',
      dataError: handleMutationError(set, get, e, 'Ошибка загрузки данных'),
    })
  }
}

function clearedDataState() {
  return {
    dataStatus: 'idle' as const,
    dataError: null as ApiErrorResponse | null,
    user: emptyUser,
    habits: [] as Habit[],
    habitLogs: [] as HabitLog[],
    goals: [] as Goal[],
    goalProgress: [] as GoalProgress[],
    categories: [] as Category[],
    foodDatabase: [] as FoodItem[],
    mealEntries: [] as MealEntry[],
    nutritionGoals: defaultNutrition,
  }
}

export const useStore = create<AppStore>((set, get) => ({
  session: null,
  authReady: false,
  dataStatus: 'idle',
  dataError: null,

  user: emptyUser,
  habits: [],
  habitLogs: [],
  goals: [],
  goalProgress: [],
  categories: [],
  foodDatabase: [],
  mealEntries: [],
  nutritionGoals: defaultNutrition,
  adminProfiles: [],

  initialize: async () => {
    try {
      const supabase = getClient()
      if (!authListenerAttached) {
        authListenerAttached = true
        supabase.auth.onAuthStateChange(async (event, session) => {
          set({ session })
          if (event === 'INITIAL_SESSION') return
          if (!session?.user) {
            set(clearedDataState())
            return
          }
          if (event === 'USER_UPDATED') {
            await get().reloadAppData({ withLoading: false })
            return
          }
          if (event === 'SIGNED_IN') {
            const uid = session.user.id
            queueMicrotask(() => {
              const s = get()
              if (!s.session?.user || s.session.user.id !== uid) return
              if (s.dataStatus === 'loading') return
              if (s.dataStatus === 'ready' && s.user.id === uid) return
              void s.reloadAppData({ withLoading: true })
            })
          }
        })
      }

      const {
        data: { user: authUser },
      } = await withTimeout(
        supabase.auth.getUser(),
        SUPABASE_AUTH_TIMEOUT_MS,
        'Превышено время ожидания проверки сессии. Проверьте интернет и SUPABASE_URL.',
      )
      const session = authUser
        ? (
            await withTimeout(
              supabase.auth.getSession(),
              SUPABASE_AUTH_TIMEOUT_MS,
              'Превышено время ожидания сессии.',
            )
          ).data.session
        : null
      set({ session: session ?? null, authReady: true })

      if (!session?.user) {
        set(clearedDataState())
      } else {
        await get().reloadAppData({ withLoading: true })
      }
    } catch (e) {
      set({
        authReady: true,
        dataStatus: 'error',
        dataError: handleMutationError(set, get, e, 'Не удалось подключиться к Supabase'),
      })
    }
  },

  reloadAppData: async (opts) => {
    const session = get().session
    if (!session?.user) return
    await runReloadAppData(set, get, opts)
  },

  signIn: async (email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { data, error } = await withTimeout(
        postAuthAction('/api/auth/sign-in', { email: normalizedEmail, password }),
        SUPABASE_AUTH_TIMEOUT_MS,
        'Сервер входа не ответил вовремя. Проверьте интернет и что в .env.local указан верный SUPABASE_URL (без /rest/v1).',
      )
      if (error) return { error: finalizeClientApiError(error) }
      if (data?.needsEmailConfirmation) return { needsEmailConfirmation: true }

      const supabase = getClient()
      const {
        data: { session },
      } = await withTimeout(
        supabase.auth.getSession(),
        SUPABASE_AUTH_TIMEOUT_MS,
        'Не удалось получить сессию после входа.',
      )
      set({ session: session ?? null })
      if (session?.user) {
        await get().reloadAppData({ withLoading: true })
        if (get().dataStatus === 'error') {
          return {
            error:
              get().dataError ??
              toApiError(
                'Не удалось загрузить данные. Проверьте, что в Supabase выполнен ../backend/supabase/schema.sql.',
              ),
          }
        }
      }
      return {}
    } catch (e) {
      return { error: finalizeClientApiError(e, 'Ошибка входа') }
    }
  },

  signUp: async (name, email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { data, error } = await withTimeout(
        postAuthAction('/api/auth/sign-up', {
          name: name.trim(),
          email: normalizedEmail,
          password,
        }),
        SUPABASE_AUTH_TIMEOUT_MS,
        'Сервер регистрации не ответил вовремя. Проверьте интернет и SUPABASE_URL (без /rest/v1).',
      )
      if (error) return { error: finalizeClientApiError(error) }
      if (data?.needsEmailConfirmation) return { needsEmailConfirmation: true }

      const supabase = getClient()
      const {
        data: { session },
      } = await withTimeout(
        supabase.auth.getSession(),
        SUPABASE_AUTH_TIMEOUT_MS,
        'Не удалось получить сессию после регистрации.',
      )
      if (session) {
        set({ session })
      }
      if (session?.user) {
        await get().reloadAppData({ withLoading: true })
        if (get().dataStatus === 'error') {
          return {
            error:
              get().dataError ??
              toApiError(
                'Не удалось загрузить данные. Проверьте, что в Supabase выполнен ../backend/supabase/schema.sql.',
              ),
          }
        }
      }
      return {}
    } catch (e) {
      return { error: finalizeClientApiError(e, 'Ошибка регистрации') }
    }
  },

  signOut: async () => {
    const supabase = getClient()
    await supabase.auth.signOut()
    set({ session: null, authReady: true, ...clearedDataState() })
  },

  forceSignOutRedirect: async () => {
    const supabase = getClient()
    await supabase.auth.signOut()
    set({ session: null, authReady: true, ...clearedDataState() })
    redirectToLogin(typeof window !== 'undefined' ? window.location.pathname : undefined)
  },

  clearDataError: () => set({ dataError: null }),

  addHabit: async (habit) => {
    const session = get().session
    if (!session?.user) return false
    const validated = validateHabitCreate(habit)
    if (!validated.success) {
      return applyValidationFailure(validated, (err) => set({ dataError: err }))
    }
    const safe = validated.data
    const supabase = getClient()
    const base = {
      user_id: session.user.id,
      name: safe.name,
      icon: safe.icon,
      color: safe.color,
      frequency: safe.frequency as Database['public']['Tables']['habits']['Insert']['frequency'],
      is_archived: safe.isArchived,
    }
    const { error } = await insertWithCategoryFallback(
      async (row) => {
        const { error: insertError } = await supabase
          .from('habits')
          .insert(row as Database['public']['Tables']['habits']['Insert'])
        return { error: insertError }
      },
      base,
      { categoryId: safe.categoryId, category: safe.category ?? habit.category }
    )
    if (error) {
      handleMutationError(set, get, error)
      return false
    }
    await get().reloadAppData()
    return true
  },

  updateHabit: async (id, updates) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    if (Object.keys(updates).length > 0) {
      const validated = validateHabitUpdate(updates)
      if (!validated.success) {
        applyValidationFailure(validated, (err) => set({ dataError: err }))
        return
      }
      updates = validated.data
    }
    const supabase = getClient()
    const patch: Database['public']['Tables']['habits']['Update'] = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.icon !== undefined) patch.icon = updates.icon
    if (updates.color !== undefined) patch.color = updates.color
    if (updates.frequency !== undefined) {
      patch.frequency = updates.frequency as Database['public']['Tables']['habits']['Update']['frequency']
    }
    if (updates.isArchived !== undefined) patch.is_archived = updates.isArchived

    let error: { message: string } | null = null
    if (updates.categoryId !== undefined) {
      const res = await supabase.from('habits').update({ ...patch, category_id: updates.categoryId }).eq('id', id)
      error = res.error
      if (error && isMissingCategoryIdColumn(error.message) && updates.category) {
        const retry = await supabase
          .from('habits')
          .update({ ...patch, category: updates.category } as Database['public']['Tables']['habits']['Update'] & {
            category: string
          })
          .eq('id', id)
        error = retry.error
      }
    } else if (Object.keys(patch).length > 0) {
      const res = await supabase.from('habits').update(patch).eq('id', id)
      error = res.error
    }
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  archiveHabit: async (id) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    const supabase = getClient()
    const { error } = await supabase.from('habits').update({ is_archived: true }).eq('id', id)
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  deleteHabit: async (id) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    const supabase = getClient()
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  toggleHabitLog: async (habitId, date) => {
    const session = get().session
    if (!session?.user) return
    const dateStr = toLogDate(date)
    const logValidated = validateHabitLogInsert({
      habitId,
      userId: session.user.id,
      logDate: dateStr,
    })
    if (!logValidated.success) {
      applyValidationFailure(logValidated, (err) => set({ dataError: err }))
      return
    }
    const supabase = getClient()
    const { data: existing } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('log_date', dateStr)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('habit_logs')
        .update({ completed: !existing.completed })
        .eq('habit_id', habitId)
        .eq('log_date', dateStr)
      if (error) {
        handleMutationError(set, get, error)
        return
      }
    } else {
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: session.user.id,
        log_date: dateStr,
        completed: true,
      })
      if (error) {
        handleMutationError(set, get, error)
        return
      }
    }
    await get().reloadAppData()
  },

  addGoal: async (goal) => {
    const session = get().session
    if (!session?.user) return false
    const validated = validateGoalCreate(goal)
    if (!validated.success) {
      return applyValidationFailure(validated, (err) => set({ dataError: err }))
    }
    const safe = validated.data
    const supabase = getClient()
    const base = {
      user_id: session.user.id,
      name: safe.name,
      title: safe.name,
      description: safe.description ?? null,
      type: safe.type,
      target_value: safe.targetValue,
      current_value: safe.currentValue,
      unit: safe.unit ?? null,
      deadline: safe.deadline,
      linked_habit_ids: safe.linkedHabitIds,
    }
    const { error } = await insertWithCategoryFallback(
      async (row) => {
        const { error: insertError } = await supabase
          .from('goals')
          .insert(row as Database['public']['Tables']['goals']['Insert'])
        return { error: insertError }
      },
      base,
      { categoryId: safe.categoryId, category: safe.category ?? goal.category }
    )
    if (error) {
      handleMutationError(set, get, error)
      return false
    }
    await get().reloadAppData()
    return true
  },

  updateGoal: async (id, updates) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    if (Object.keys(updates).length > 0) {
      const validated = validateGoalUpdate(updates)
      if (!validated.success) {
        applyValidationFailure(validated, (err) => set({ dataError: err }))
        return
      }
      updates = validated.data
    }
    const supabase = getClient()
    const patch: Database['public']['Tables']['goals']['Update'] & { title?: string } = {}
    if (updates.name !== undefined) {
      patch.name = updates.name
      patch.title = updates.name
    }
    if (updates.description !== undefined) patch.description = updates.description ?? null
    if (updates.type !== undefined) patch.type = updates.type
    if (updates.targetValue !== undefined) patch.target_value = updates.targetValue
    if (updates.currentValue !== undefined) patch.current_value = updates.currentValue
    if (updates.unit !== undefined) patch.unit = updates.unit ?? null
    if (updates.deadline !== undefined) {
      patch.deadline = format(updates.deadline, 'yyyy-MM-dd')
    }
    if (updates.linkedHabitIds !== undefined) patch.linked_habit_ids = updates.linkedHabitIds

    let error: { message: string } | null = null
    if (updates.categoryId !== undefined) {
      const res = await supabase.from('goals').update({ ...patch, category_id: updates.categoryId }).eq('id', id)
      error = res.error
      if (error && isMissingCategoryIdColumn(error.message) && updates.category) {
        const retry = await supabase
          .from('goals')
          .update({ ...patch, category: updates.category } as Database['public']['Tables']['goals']['Update'] & {
            category: string
          })
          .eq('id', id)
        error = retry.error
      }
    } else if (Object.keys(patch).length > 0) {
      const res = await supabase.from('goals').update(patch).eq('id', id)
      error = res.error
    }
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  deleteGoal: async (id) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    const supabase = getClient()
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  addGoalProgress: async (progress) => {
    const session = get().session
    if (!session?.user) return
    const validated = validateGoalProgressInsert(progress)
    if (!validated.success) {
      applyValidationFailure(validated, (err) => set({ dataError: err }))
      return
    }
    const safe = validated.data
    const supabase = getClient()
    const { error: insErr } = await supabase.from('goal_progress').insert({
      user_id: session.user.id,
      goal_id: safe.goalId,
      progress_date: format(safe.date, 'yyyy-MM-dd'),
      value: safe.value,
      note: safe.note ?? null,
    })
    if (insErr) {
      handleMutationError(set, get, insErr)
      return
    }
    const { error: updErr } = await supabase
      .from('goals')
      .update({ current_value: safe.value })
      .eq('id', safe.goalId)
    if (updErr) {
      handleMutationError(set, get, updErr)
      return
    }
    await get().reloadAppData()
  },

  updateUser: async (updates) => {
    const session = get().session
    if (!session?.user) return
    const validated = validateProfilePatch(updates)
    if (!validated.success) {
      applyValidationFailure(validated, (err) => set({ dataError: err }))
      return
    }
    updates = validated.data
    const supabase = getClient()
    const patch: Database['public']['Tables']['profiles']['Update'] = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.email !== undefined) patch.email = updates.email
    if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl ?? null
    if (updates.telegramConnected !== undefined) patch.telegram_connected = updates.telegramConnected
    if (updates.telegramUsername !== undefined) patch.telegram_username = updates.telegramUsername ?? null
    if (updates.theme !== undefined) patch.theme = updates.theme
    if (updates.reminderTime !== undefined) patch.reminder_time = updates.reminderTime ?? null
    if (updates.remindersEnabled !== undefined) patch.reminders_enabled = updates.remindersEnabled
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id)
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    set((state) => ({ user: { ...state.user, ...updates } }))
    await get().reloadAppData()
  },

  addCategory: async (cat) => {
    const session = get().session
    if (!session?.user) return
    const validated = validateCategoryCreate(cat)
    if (!validated.success) {
      applyValidationFailure(validated, (err) => set({ dataError: err }))
      return
    }
    const safe = validated.data
    const supabase = getClient()
    const { error } = await supabase.from('categories').insert({
      user_id: session.user.id,
      name: safe.name,
      color: safe.color,
      icon: safe.icon,
    })
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  updateCategory: async (id, updates) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    if (updates.name !== undefined) {
      const validated = validateCategoryCreate({
        name: updates.name,
        color: updates.color ?? '#6366f1',
        icon: updates.icon ?? '🏷️',
      })
      if (!validated.success) {
        applyValidationFailure(validated, (err) => set({ dataError: err }))
        return
      }
      updates = { ...updates, name: validated.data.name }
    }
    const supabase = getClient()
    const patch: Database['public']['Tables']['categories']['Update'] = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.color !== undefined) patch.color = updates.color
    if (updates.icon !== undefined) patch.icon = updates.icon
    const { error } = await supabase.from('categories').update(patch).eq('id', id)
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  deleteCategory: async (id) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    const supabase = getClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  addMealEntry: async (entry) => {
    const session = get().session
    if (!session?.user) return
    const validated = validateMealEntryInsert(entry)
    if (!validated.success) {
      applyValidationFailure(validated, (err) => set({ dataError: err }))
      return
    }
    const safe = validated.data
    const supabase = getClient()
    const { error } = await supabase.from('meal_entries').insert({
      user_id: session.user.id,
      food_id: safe.foodId,
      entry_date: safe.date,
      meal_type: safe.mealType,
      amount: safe.amount,
      calories: safe.calories,
      protein: safe.protein,
      fat: safe.fat,
      carbs: safe.carbs,
    })
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  deleteMealEntry: async (id) => {
    try {
      requireSessionForMutation({ session: get().session, user: get().user })
    } catch {
      return
    }
    const supabase = getClient()
    const { error } = await supabase.from('meal_entries').delete().eq('id', id)
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  updateNutritionGoals: async (goals) => {
    const session = get().session
    if (!session?.user) return
    const validated = validateNutritionGoalsUpdate(goals)
    if (!validated.success) {
      applyValidationFailure(validated, (err) => set({ dataError: err }))
      return
    }
    const supabase = getClient()
    const merged = { ...get().nutritionGoals, ...validated.data }
    const { error } = await supabase.from('nutrition_goals').upsert({
      user_id: session.user.id,
      calories: merged.calories,
      protein: merged.protein,
      fat: merged.fat,
      carbs: merged.carbs,
    })
    if (error) {
      handleMutationError(set, get, error)
      return
    }
    await get().reloadAppData()
  },

  loadAdminProfiles: async () => {
    const supabase = getClient()
    try {
      requireAdmin({ session: get().session, user: get().user, supabase })
      const profiles = await fetchAdminProfiles(supabase)
      set({ adminProfiles: profiles })
    } catch (e) {
      set({
        dataError: handleMutationError(set, get, e, 'Нет доступа к админ-панели'),
      })
    }
  },

  setUserRole: async (userId, role) => {
    const supabase = getClient()
    const session = get().session
    const user = get().user
    try {
      requireAdmin({ session, user, supabase })
    } catch (e) {
      return { error: finalizeClientApiError(e, 'Нет доступа') }
    }
    const { error } = await supabase.rpc('admin_set_user_role', {
      target_user_id: userId,
      new_role: role,
    })
    if (error) {
      await logSecurityEvent(supabase, {
        userId: session!.user.id,
        action: 'admin_set_role_failed',
        resource: 'profiles',
        details: { targetUserId: userId, role, message: error.message },
      })
      return { error: finalizeClientApiError(error) }
    }
    await logSecurityEvent(supabase, {
      userId: session!.user.id,
      action: 'admin_set_role',
      resource: 'profiles',
      details: { targetUserId: userId, role },
    })
    await get().loadAdminProfiles()
    if (userId === session!.user.id) {
      await get().reloadAppData()
    }
    return {}
  },
}))
