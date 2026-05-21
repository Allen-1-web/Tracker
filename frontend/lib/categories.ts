import type { Category } from '@/lib/types'

export function categoryLookup(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.id, c]))
}

export function resolveCategoryName(
  categoriesById: Map<string, Category>,
  categoryId: string | null
): string {
  if (!categoryId) return 'Без категории'
  return categoriesById.get(categoryId)?.name ?? 'Без категории'
}

export function findCategoryByName(
  categories: Category[],
  name: string
): Category | undefined {
  return categories.find((c) => c.name === name)
}
