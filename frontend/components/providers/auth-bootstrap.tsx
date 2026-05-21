'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

/** Инициализация auth + подписка на сессию (токен в cookies → все запросы Supabase). */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const initialize = useStore((s) => s.initialize)
  const authReady = useStore((s) => s.authReady)

  useEffect(() => {
    void initialize()
  }, [initialize])

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">Загрузка...</p>
      </div>
    )
  }

  return <>{children}</>
}
