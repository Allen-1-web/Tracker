'use client'

interface MacroBarProps {
  label: string
  current: number
  goal: number
  unit: string
  color: string
  bgColor: string
}

export function MacroBar({ label, current, goal, unit, color, bgColor }: MacroBarProps) {
  const pct = goal === 0 ? 0 : Math.min(Math.round((current / goal) * 100), 100)
  const over = current > goal

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <span className={over ? 'text-red-500 font-semibold' : 'text-[var(--muted-foreground)]'}>
          {current} / {goal} {unit}
        </span>
      </div>
      <div className={`h-2.5 w-full rounded-full ${bgColor}`}>
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {over
          ? `Превышено на ${current - goal} ${unit}`
          : `Осталось ${goal - current} ${unit} (${100 - pct}%)`}
      </p>
    </div>
  )
}
