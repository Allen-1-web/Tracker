import type { Metadata } from 'next'
import { AuthBootstrap } from '@/components/providers/auth-bootstrap'
import './globals.css'

export const metadata: Metadata = {
  title: 'Трекер целей и привычек',
  description: 'Привычки, цели, питание',
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
