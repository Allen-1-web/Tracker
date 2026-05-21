import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type EmptyStateAction =
  | { label: string; href: string }
  | { label: string; onClick: () => void }

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: EmptyStateAction
  /** Меньше отступов — для вложения в карточку */
  compact?: boolean
  className?: string
}

export function EmptyState({ icon, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        compact ? 'py-6' : 'py-12',
        className
      )}
    >
      {icon && <div className={cn('mb-3', compact ? 'text-4xl' : 'text-5xl mb-4')}>{icon}</div>}
      <h3 className={cn('font-semibold text-[var(--foreground)] mb-2', compact ? 'text-base' : 'text-lg')}>
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-[var(--muted-foreground)] max-w-sm',
            compact ? 'text-xs mb-4' : 'text-sm mb-6'
          )}
        >
          {description}
        </p>
      )}
      {action &&
        ('href' in action ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  )
}
