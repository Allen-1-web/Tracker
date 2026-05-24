import type { Metadata } from 'next'
import { AuthBootstrap } from '@/components/providers/auth-bootstrap'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tracker — ежедневные привычки',
  description: 'Tracker помогает держать ежедневные привычки. Веб-приложение и Telegram companion.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  )
}
