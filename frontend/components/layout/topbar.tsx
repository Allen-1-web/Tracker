'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  title: string
  onOpenMobileNav?: () => void
}

export function Topbar({ title, onOpenMobileNav }: TopbarProps) {
  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru })

  return (
    <header className="sticky top-0 z-20 flex min-w-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      {onOpenMobileNav && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-[var(--foreground)] sm:text-xl">{title}</h1>
        <p className="truncate text-xs text-[var(--muted-foreground)] capitalize">{today}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--primary)]" />
        </Button>
      </div>
    </header>
  )
}
