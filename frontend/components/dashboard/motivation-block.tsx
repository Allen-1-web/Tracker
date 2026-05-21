import { Sparkles } from 'lucide-react'

interface MotivationBlockProps {
  quote: string
}

export function MotivationBlock({ quote }: MotivationBlockProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-l-2 border-[var(--primary)]/50 bg-[var(--primary)]/5 pl-3 pr-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
        <Sparkles className="h-4 w-4 text-[var(--primary)]" />
      </div>
      <div>
        <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-1">Мысль дня</p>
        <p className="text-sm text-[var(--foreground)] italic">«{quote}»</p>
      </div>
    </div>
  )
}
