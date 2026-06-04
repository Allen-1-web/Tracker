'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { ReminderSchedulesPanel } from '@/components/settings/reminder-schedules'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RemindersPage() {
  return (
    <AppLayout title="Напоминания">
      <div className="max-w-2xl space-y-4" data-testid="reminders-page">
        <Card>
          <CardHeader>
            <CardTitle>Расписание</CardTitle>
            <CardDescription>
              Ежедневные напоминания в Telegram (нужен подключённый бот и запущенный worker)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReminderSchedulesPanel />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
