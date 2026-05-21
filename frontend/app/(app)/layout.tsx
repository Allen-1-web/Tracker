'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const authReady = useStore((s) => s.authReady)
  const session = useStore((s) => s.session)
  const dataStatus = useStore((s) => s.dataStatus)
  const dataError = useStore((s) => s.dataError)
  const reloadAppData = useStore((s) => s.reloadAppData)
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (dataStatus === 'error') return
    if (!session) router.replace('/login')
  }, [authReady, session, dataStatus, router])

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">Загрузка...</p>
      </div>
    )
  }

  if (dataStatus === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] p-6 text-center">
        <div className="max-w-lg space-y-2">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Приложение не загрузило данные</h1>
          <p className="text-sm text-[var(--destructive)] break-words">
            {dataError?.message ?? 'Сервер не ответил или вернул ошибку.'}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Если apply_fix.sql уже выполнен — подождите 2–3 минуты (обновление кэша API), нажмите «Повторить» или
            Ctrl+F5. В Supabase: Settings → API → Reload schema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reloadAppData({ withLoading: true })}
          className="text-sm font-medium text-[var(--primary)] underline"
        >
          Повторить
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">Загрузка...</p>
      </div>
    )
  }

  if (dataStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">Загрузка...</p>
      </div>
    )
  }

  return <>{children}</>
}
