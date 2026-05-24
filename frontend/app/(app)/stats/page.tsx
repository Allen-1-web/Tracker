'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { StatsDashboard } from '@/components/stats/stats-dashboard'

export default function StatsPage() {
  return (
    <AppLayout title="Аналитика">
      <StatsDashboard />
    </AppLayout>
  )
}
