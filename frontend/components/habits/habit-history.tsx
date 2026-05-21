import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckCircle2, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import type { HabitLog } from '@/lib/types'

interface HabitHistoryProps {
  logs: HabitLog[]
}

export function HabitHistory({ logs }: HabitHistoryProps) {
  const recent = [...logs].reverse().slice(0, 30)

  if (recent.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="История пуста"
        description="За выбранный период ещё нет отметок о выполнении — отметьте день в календаре выше."
        compact
      />
    )
  }

  return (
    <div className="space-y-1">
      {recent.map((log, i) => {
        const date = parseISO(log.date)
        return (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 px-4 rounded-lg hover:bg-[var(--accent)] transition-colors"
          >
            <div>
              <p className="text-sm capitalize">
                {format(date, 'EEEE, d MMMM', { locale: ru })}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{log.date}</p>
            </div>
            {log.completed ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Выполнено</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Пропущено</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
