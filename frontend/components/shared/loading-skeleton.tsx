import { cn } from '@/lib/utils'

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[var(--muted)]', className)}
    />
  )
}

export function HabitCardSkeleton() {
  return (
    <div className="rounded-lg bg-[var(--muted)]/25 p-4 space-y-2.5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-10" />
      </div>
    </div>
  )
}

export function GoalCardSkeleton() {
  return (
    <div className="rounded-lg bg-[var(--muted)]/25 p-4 space-y-2.5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export { Skeleton }
