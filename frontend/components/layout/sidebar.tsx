'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Settings,
  Zap,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/habits', label: 'Привычки', icon: CheckSquare },
  { href: '/goals', label: 'Цели', icon: Target },
  { href: '/nutrition', label: 'Питание', icon: UtensilsCrossed },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export function SidebarNav({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex-1 px-3 py-4 space-y-1', className)}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[var(--border)] shrink-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]">
        <Zap className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-bold text-[var(--foreground)] leading-none">HabitFlow</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Трекер привычек</p>
      </div>
    </div>
  )
}

function SidebarUser() {
  return (
    <div className="border-t border-[var(--border)] p-4 mt-auto shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-white font-semibold text-sm">
            А
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Алексей</p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">alexey@example.com</p>
          </div>
        </div>
      </div>
  )
}

/** Тот же блок навигации, что в сайдбаре — для выезжающего меню на телефоне */
export function MobileSidebarPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--card)]">
      <SidebarBrand />
      <SidebarNav onNavigate={onNavigate} className="min-h-0 overflow-y-auto" />
      <SidebarUser />
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-30 h-full w-64 border-r border-[var(--border)] bg-[var(--card)] flex-col">
      <SidebarBrand />
      <SidebarNav />
      <SidebarUser />
    </aside>
  )
}
