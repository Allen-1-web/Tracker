'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { useStore } from '@/lib/store'
import type { UserRole } from '@/lib/auth/roles'

export default function AdminPage() {
  const router = useRouter()
  const isAdmin = useAdmin()
  const authReady = useStore((s) => s.authReady)
  const session = useStore((s) => s.session)
  const adminProfiles = useStore((s) => s.adminProfiles)
  const loadAdminProfiles = useStore((s) => s.loadAdminProfiles)
  const setUserRole = useStore((s) => s.setUserRole)
  const dataError = useStore((s) => s.dataError)

  useEffect(() => {
    if (!authReady) return
    if (!session) {
      router.replace('/login?next=/admin')
      return
    }
    if (!isAdmin) {
      router.replace('/dashboard')
      return
    }
    void loadAdminProfiles()
  }, [authReady, session, isAdmin, router, loadAdminProfiles])

  if (!authReady || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">Проверка доступа...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Админ-панель</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Управление ролями пользователей. Доступ только для роли admin (проверка в middleware и RLS).
        </p>
      </header>

      {dataError && (
        <p className="rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
          {dataError.message}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]/40">
            <tr>
              <th className="px-4 py-2 font-medium">Имя</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Роль</th>
            </tr>
          </thead>
          <tbody>
            {adminProfiles.map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2">{p.name ?? '—'}</td>
                <td className="px-4 py-2">{p.email ?? '—'}</td>
                <td className="px-4 py-2">
                  <select
                    className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1"
                    value={p.role}
                    onChange={(e) => {
                      void setUserRole(p.id, e.target.value as UserRole)
                    }}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
            {adminProfiles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[var(--muted-foreground)]">
                  Нет данных или миграция 20260523 не применена.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
