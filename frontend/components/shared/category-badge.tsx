'use client'

import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'

interface CategoryBadgeProps {
  name: string
  color?: string
  icon?: string
  className?: string
}

export function CategoryBadge({ name, color = '#6366f1', icon, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', className)}
      style={{ backgroundColor: color + '20', color }}
    >
      {icon && <span>{icon}</span>}
      {name}
    </span>
  )
}

/** Бейдж с цветом и иконкой из справочника categories по categoryId */
export function CategoryBadgeById({
  categoryId,
  fallbackName,
  className,
}: {
  categoryId: string | null
  fallbackName: string
  className?: string
}) {
  const categories = useStore((s) => s.categories)
  const cat = categoryId ? categories.find((c) => c.id === categoryId) : undefined
  return (
    <CategoryBadge
      name={cat?.name ?? fallbackName}
      color={cat?.color}
      icon={cat?.icon}
      className={className}
    />
  )
}
