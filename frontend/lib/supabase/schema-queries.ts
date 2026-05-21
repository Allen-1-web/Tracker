import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

const HABITS_NEW =
  'id,user_id,name,icon,color,category_id,frequency,created_at,is_archived'
const HABITS_LEGACY = 'id,user_id,name,icon,color,category,frequency,created_at,is_archived'
const GOALS_NEW =
  'id,user_id,name,title,description,type,target_value,current_value,unit,deadline,category_id,linked_habit_ids,created_at'
const GOALS_LEGACY =
  'id,user_id,name,title,description,type,target_value,current_value,unit,deadline,category,linked_habit_ids,created_at'
const PROFILE_COLS =
  'id,name,email,avatar_url,telegram_connected,telegram_username,theme,reminder_time,reminders_enabled,updated_at'

export function isSchemaMismatchError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('schema cache') ||
    m.includes('could not find') ||
    m.includes('pgrst') ||
    (m.includes('does not exist') && (m.includes('relation') || m.includes('column')))
  )
}

export function formatSupabaseErrors(
  items: { table: string; error: PostgrestError | null }[]
): string | null {
  const failed = items.filter((i) => i.error)
  if (failed.length === 0) return null
  return failed.map((i) => `${i.table}: ${i.error!.message}`).join(' | ')
}

export async function fetchProfileForUser(supabase: SupabaseClient, userId: string) {
  let res = await supabase.from('profiles').select(PROFILE_COLS).eq('id', userId).maybeSingle()
  if (res.error && isSchemaMismatchError(res.error.message)) {
    res = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  }
  if (res.error) {
    res = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
  }
  return res
}

export async function fetchHabitsForUser(supabase: SupabaseClient, userId: string) {
  const res = await supabase.from('habits').select(HABITS_NEW).eq('user_id', userId).order('created_at')
  if (!res.error) return res
  if (isMissingCategoryIdColumn(res.error.message) || isSchemaMismatchError(res.error.message)) {
    const legacy = await supabase.from('habits').select(HABITS_LEGACY).eq('user_id', userId).order('created_at')
    if (!legacy.error) return legacy
    if (isSchemaMismatchError(legacy.error.message)) {
      return supabase.from('habits').select('*').eq('user_id', userId).order('created_at')
    }
    return legacy
  }
  return res
}

export async function fetchGoalsForUser(supabase: SupabaseClient, userId: string) {
  const res = await supabase.from('goals').select(GOALS_NEW).eq('user_id', userId).order('created_at')
  if (!res.error) return res
  if (isMissingCategoryIdColumn(res.error.message) || isSchemaMismatchError(res.error.message)) {
    const legacy = await supabase.from('goals').select(GOALS_LEGACY).eq('user_id', userId).order('created_at')
    if (!legacy.error) return legacy
    if (isSchemaMismatchError(legacy.error.message)) {
      return supabase.from('goals').select('*').eq('user_id', userId).order('created_at')
    }
    return legacy
  }
  return res
}

/** Ошибка PostgREST: в таблице нет колонки category_id (миграция не применена). */
function isMissingCategoryIdColumn(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('category_id') &&
    (m.includes('schema cache') ||
      m.includes('could not find') ||
      m.includes('does not exist') ||
      m.includes('column'))
  )
}
