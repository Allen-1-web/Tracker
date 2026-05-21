import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import type { GoalProgress } from '@/lib/types'

interface ProgressFeedProps {
  entries: GoalProgress[]
  unit?: string
}

export function ProgressFeed({ entries, unit = '' }: ProgressFeedProps) {
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon="📈"
        title="Записей прогресса нет"
        description="Добавьте первую отметку по цели — здесь появится история изменений."
        compact
      />
    )
  }

  return (
    <div className="space-y-1">
      {sorted.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-[var(--accent)] transition-colors">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 mt-0.5">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            {entry.note && (
              <p className="text-sm font-medium">{entry.note}</p>
            )}
            <p className="text-xs text-[var(--muted-foreground)]">
              {format(entry.date, 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <span className="text-sm font-semibold text-[var(--primary)] shrink-0">
            {entry.value} {unit}
          </span>
        </div>
      ))}
    </div>
  )
}
