'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { useStore } from '@/lib/store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const authReady = useStore((s) => s.authReady)
  const session = useStore((s) => s.session)
  const isAdmin = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (!session) {
      router.replace('/login?next=/admin')
      return
    }
    if (!isAdmin) {
      router.replace('/dashboard')
    }
  }, [authReady, session, isAdmin, router])

  if (!authReady || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">Проверка доступа...</p>
      </div>
    )
  }

  return <>{children}</>
}
