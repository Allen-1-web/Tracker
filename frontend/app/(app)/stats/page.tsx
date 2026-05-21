import { redirect } from 'next/navigation'

/** Расширенная аналитика убрана с раннего этапа — дневной прогресс на /dashboard */
export default function StatsPage() {
  redirect('/dashboard')
}
