import { CheckCircle2, Flame, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface TodayProgressProps {
  completed: number
  total: number
  streak: number
  completionRate: number
}

export function TodayProgress({ completed, total, streak, completionRate }: TodayProgressProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed}/{total}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Привычек сегодня</p>
            </div>
          </div>
          <Progress value={pct} className="mt-3" />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">{pct}% выполнено</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Дней подряд</p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-3">
            {streak >= 7 ? '🔥 Отличная серия!' : 'Продолжай в том же духе!'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-xs text-[var(--muted-foreground)]">За последние 30 дней</p>
            </div>
          </div>
          <Progress value={completionRate} className="mt-3" indicatorColor="#22c55e" />
        </CardContent>
      </Card>
    </div>
  )
}
