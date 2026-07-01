'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ru">
      <body>
        <h2>Что-то пошло не так</h2>
        <p>Попробуйте обновить страницу.</p>
        <button type="button" onClick={() => reset()}>
          Попробовать снова
        </button>
      </body>
    </html>
  )
}
