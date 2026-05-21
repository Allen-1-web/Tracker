import type { PostgrestError } from '@supabase/supabase-js'

/** Ошибка PostgREST: в таблице нет колонки category_id (миграция не применена). */
export function isMissingCategoryIdColumn(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('category_id') &&
    (m.includes('schema cache') ||
      m.includes('could not find') ||
      m.includes('does not exist') ||
      m.includes('column'))
  )
}

/** Ошибка: в таблице нет текстовой колонки category (уже только category_id). */
export function isMissingCategoryTextColumn(message: string): boolean {
  const m = message.toLowerCase()
  if (m.includes('category_id')) return false
  return (
    (m.includes("'category'") || m.includes('column "category"')) &&
    (m.includes('schema cache') ||
      m.includes('could not find') ||
      m.includes('does not exist') ||
      m.includes('column'))
  )
}

function isCategoryTextRequired(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('null value') &&
    m.includes('category') &&
    !m.includes('category_id')
  )
}

type CategoryPayload = {
  categoryId: string | null
  category: string
}

/**
 * Вставка с учётом старой схемы (category text), новой (category_id) и переходной (обе колонки).
 */
export async function insertWithCategoryFallback<T extends Record<string, unknown>>(
  insert: (row: T) => Promise<{ error: PostgrestError | null }>,
  base: T,
  { categoryId, category }: CategoryPayload
): Promise<{ error: PostgrestError | null }> {
  if (!categoryId && !category) {
    return {
      error: {
        message: 'Выберите категорию',
        details: '',
        hint: '',
        code: 'client',
      } as PostgrestError,
    }
  }

  const attempts: Record<string, unknown>[] = []
  if (categoryId && category) {
    attempts.push({ ...base, category_id: categoryId, category })
  }
  if (categoryId) {
    attempts.push({ ...base, category_id: categoryId })
  }
  if (category) {
    attempts.push({ ...base, category })
  }

  let lastError: PostgrestError | null = null
  for (const row of attempts) {
    const { error } = await insert(row as T)
    if (!error) return { error: null }
    lastError = error
    if (
      !isMissingCategoryIdColumn(error.message) &&
      !isMissingCategoryTextColumn(error.message) &&
      !isCategoryTextRequired(error.message)
    ) {
      return { error }
    }
  }
  return { error: lastError }
}
