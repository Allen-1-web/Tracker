import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface DashboardGreetingProps {
  name: string
  quote: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 17) return 'Добрый день'
  return 'Добрый вечер'
}

export function DashboardGreeting({ name, quote }: DashboardGreetingProps) {
  const dateStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: ru })

  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--foreground)]">
        {getGreeting()}, {name}! 👋
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mt-1 capitalize">{dateStr}</p>
      <p className="text-sm text-[var(--muted-foreground)] mt-2 italic line-clamp-2">«{quote}»</p>
    </div>
  )
}
