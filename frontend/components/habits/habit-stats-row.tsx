import { Flame, Trophy, BarChart2, CheckSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { HabitStats } from '@/lib/types'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: color + '20' }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function HabitStatsRow({ stats }: { stats: HabitStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Flame className="h-5 w-5" />}
        label="Текущий streak"
        value={`${stats.currentStreak} дн.`}
        color="#f97316"
      />
      <StatCard
        icon={<Trophy className="h-5 w-5" />}
        label="Лучший streak"
        value={`${stats.bestStreak} дн.`}
        color="#eab308"
      />
      <StatCard
        icon={<BarChart2 className="h-5 w-5" />}
        label="За 30 дней"
        value={`${stats.completionRate30}%`}
        color="#6366f1"
      />
      <StatCard
        icon={<CheckSquare className="h-5 w-5" />}
        label="Всего выполнено"
        value={stats.totalCompleted}
        color="#22c55e"
      />
    </div>
  )
}
