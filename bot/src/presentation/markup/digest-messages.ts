import type { DailyReport } from '../../application/services/report.service.js'
import { formatRuDate } from '../../shared/time/dates.js'
import { escapeMarkdown } from '../../shared/telegram/markdown.js'

export function formatDailySummaryMessage(report: DailyReport): string {
  return (
    `📊 *Сводка за ${formatRuDate(report.date)}*\n\n` +
    `📋 Привычки: *${report.habits.completed}/${report.habits.total}* (${report.habits.percent}%)\n` +
    `🎯 Цели: *${report.goals.count}* активных (ср. ${report.goals.averageProgress}%)\n` +
    `🍽 Калории: *${report.nutrition.calories}* / ${report.nutrition.calorieGoal} (${report.nutrition.caloriePercent}%)`
  )
}

export function formatWeeklySummaryMessage(report: DailyReport): string {
  return (
    `📈 *Еженедельный отчёт*\n\n` +
    `_Статистика на ${formatRuDate(report.date)}:_\n\n` +
    `📋 Привычки: *${report.habits.completed}/${report.habits.total}* (${report.habits.percent}%)\n` +
    `🎯 Цели: *${report.goals.count}* активных (ср. ${report.goals.averageProgress}%)\n` +
    `🍽 Калории: *${report.nutrition.calories}* / ${report.nutrition.calorieGoal} (${report.nutrition.caloriePercent}%)`
  )
}

export function formatMissedHabitsMessage(date: string, names: string[]): string {
  const lines = names.map((n) => `• ${escapeMarkdown(n)}`).join('\n')
  return (
    `⚠️ *Невыполненные привычки — ${formatRuDate(date)}*\n\n` +
    lines +
    '\n\n_Отметьте их в боте: /habits_'
  )
}

export function formatHydrationMessage(): string {
  return '💧 *Пора выпить воды*\n\nНебольшой глоток — и дальше по делам.'
}
