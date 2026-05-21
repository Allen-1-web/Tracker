'use client'

import type { MealEntry, NutritionGoals } from '@/lib/types'

interface Rec {
  icon: string
  text: string
  type: 'info' | 'warning' | 'success' | 'danger'
}

interface DietRecommendationsProps {
  entries: MealEntry[]
  goals: NutritionGoals
}

const COLOR: Record<Rec['type'], string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  info:    'bg-blue-50  border-blue-200  text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  danger:  'bg-red-50   border-red-200   text-red-800',
}

export function DietRecommendations({ entries, goals }: DietRecommendationsProps) {
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein:  acc.protein  + e.protein,
      fat:      acc.fat      + e.fat,
      carbs:    acc.carbs    + e.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  const recs: Rec[] = []

  const calPct = goals.calories === 0 ? 0 : totals.calories / goals.calories
  if (calPct > 1.1) {
    recs.push({ icon: '⚠️', type: 'danger',  text: `Превышена норма калорий на ${Math.round((calPct - 1) * 100)}%. Постарайтесь не перекусывать.` })
  } else if (calPct >= 0.9) {
    recs.push({ icon: '✅', type: 'success', text: 'Отличный день! Вы близки к своей норме калорий.' })
  } else if (calPct < 0.5 && entries.length > 0) {
    recs.push({ icon: '🍽️', type: 'warning', text: 'Вы съели менее половины дневной нормы. Не пропускайте приёмы пищи.' })
  }

  const protPct = goals.protein === 0 ? 1 : totals.protein / goals.protein
  if (protPct < 0.6) {
    recs.push({ icon: '🥩', type: 'info', text: `Белок: ${Math.round(totals.protein)}г из ${goals.protein}г. Добавьте куриную грудку, творог или яйца.` })
  } else if (protPct >= 1) {
    recs.push({ icon: '💪', type: 'success', text: 'Норма белка выполнена! Мышцы скажут спасибо.' })
  }

  const fatPct = goals.fat === 0 ? 0 : totals.fat / goals.fat
  if (fatPct > 1.2) {
    recs.push({ icon: '🛑', type: 'danger', text: 'Превышена норма жиров. Ограничьте жареное и жирные соусы.' })
  }

  const carbPct = goals.carbs === 0 ? 1 : totals.carbs / goals.carbs
  if (carbPct < 0.4 && entries.length > 0) {
    recs.push({ icon: '🌾', type: 'info', text: 'Мало углеводов. Добавьте крупы или цельнозерновой хлеб для энергии.' })
  }

  if (entries.length === 0) {
    recs.push({ icon: '📝', type: 'info', text: 'Добавьте первый приём пищи, и вы получите персональные рекомендации.' })
  }

  if (recs.length === 0) {
    recs.push({ icon: '🎯', type: 'success', text: 'Рацион сбалансирован. Продолжайте в том же духе!' })
  }

  return (
    <div className="space-y-2">
      {recs.map((rec, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${COLOR[rec.type]}`}
        >
          <span className="shrink-0 text-base leading-snug">{rec.icon}</span>
          <p>{rec.text}</p>
        </div>
      ))}
    </div>
  )
}
