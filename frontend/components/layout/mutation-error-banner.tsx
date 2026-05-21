'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HttpStatus } from '@/lib/errors/api-error'
import { useStore } from '@/lib/store'

export function MutationErrorBanner() {
  const dataError = useStore((s) => s.dataError)
  const dataStatus = useStore((s) => s.dataStatus)
  const clearDataError = useStore((s) => s.clearDataError)
  const reloadAppData = useStore((s) => s.reloadAppData)

  if (!dataError || dataStatus !== 'ready') return null

  return (
    <div
      role="alert"
      className="mb-4 flex flex-col gap-3 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-3 text-sm sm:flex-row sm:items-start sm:gap-4"
    >
      <div className="flex gap-3 min-w-0 flex-1">
        <AlertCircle className="h-5 w-5 shrink-0 text-[var(--destructive)]" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium text-[var(--foreground)]">
            {dataError.status === HttpStatus.FORBIDDEN
              ? 'Нет прав'
              : 'Не удалось выполнить запрос'}
          </p>
          <p className="mt-1 text-[var(--muted-foreground)] break-words">{dataError.message}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => void reloadAppData({ withLoading: true })}>
          Обновить данные
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={clearDataError}>
          Закрыть
        </Button>
      </div>
    </div>
  )
}
