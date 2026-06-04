import { InlineKeyboard } from 'grammy'
import type { TodayHabitItem } from '../../domain/habit.js'
import type { GoalListItem } from '../../domain/goal.js'
import type { NutritionDaySummary } from '../../domain/nutrition.js'
import type { DailyReport } from '../../application/services/report.service.js'
import type { LinkedUser } from '../../domain/user.js'
import { formatRuDate } from '../../shared/time/dates.js'
import { escapeMarkdown } from '../../shared/telegram/markdown.js'
import { habitToggleCallback } from '../../shared/validation/callbacks.js'

export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📋 Привычки', 'm:hab')
    .text('🎯 Цели', 'm:gol')
    .row()
    .text('🍽 Питание', 'm:nut')
    .text('📊 Отчёт', 'm:rep')
    .row()
    .text('⏰ Напоминания', 'm:rem')
    .text('⚙️ Настройки', 'm:set')
}

export function habitsKeyboard(items: TodayHabitItem[]): InlineKeyboard {
  const kb = new InlineKeyboard()
  items.forEach((item, index) => {
    const mark = item.completed ? '✅' : '⬜'
    const label = `${mark} ${item.habit.icon} ${item.habit.name}`.slice(0, 60)
    if (index > 0 && index % 2 === 0) kb.row()
    kb.text(label, habitToggleCallback(item.habit.id))
  })
  kb.row().text('« Меню', 'm:home')
  return kb
}

export function backToMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('« Меню', 'm:home')
}

export function formatHabitsMessage(date: string, items: TodayHabitItem[]): string {
  const completed = items.filter((i) => i.completed).length
  const lines = items.length
    ? items.map(
        (i) =>
          `${i.completed ? '✅' : '⬜'} ${i.habit.icon} ${escapeMarkdown(i.habit.name)}`,
      )
    : ['Сегодня нет запланированных привычек.']

  return (
    `📋 *Привычки на ${formatRuDate(date)}*\n\n` +
    lines.join('\n') +
    `\n\n_${completed}/${items.length} выполнено_`
  )
}

export function formatGoalsMessage(items: GoalListItem[]): string {
  if (items.length === 0) {
    return '🎯 *Цели*\n\nНет активных целей. Добавьте их в веб-приложении.'
  }

  const lines = items.slice(0, 10).map((item) => {
    const unit = item.goal.unit ? ` ${item.goal.unit}` : ''
    const bar = progressBar(item.progressPercent)
    return (
      `• *${escapeMarkdown(item.goal.name)}*\n` +
      `${bar} ${item.progressPercent}%\n` +
      `${item.goal.currentValue}/${item.goal.targetValue}${unit}`
    )
  })

  return `🎯 *Активные цели*\n\n${lines.join('\n\n')}`
}

export function formatNutritionMessage(summary: NutritionDaySummary): string {
  const { totals, goals, percents, entryCount } = summary
  return (
    `🍽 *Питание — ${formatRuDate(summary.date)}*\n\n` +
    `Калории: *${Math.round(totals.calories)}* / ${goals.calories} (${percents.calories}%)\n` +
    `Б: ${Math.round(totals.protein)} / ${goals.protein} г (${percents.protein}%)\n` +
    `Ж: ${Math.round(totals.fat)} / ${goals.fat} г (${percents.fat}%)\n` +
    `У: ${Math.round(totals.carbs)} / ${goals.carbs} г (${percents.carbs}%)\n\n` +
    `_Записей за день: ${entryCount}_`
  )
}

export function formatReportMessage(report: DailyReport): string {
  return (
    `📊 *Сводка за ${formatRuDate(report.date)}*\n\n` +
    `📋 Привычки: *${report.habits.completed}/${report.habits.total}* (${report.habits.percent}%)\n` +
    `🎯 Цели: *${report.goals.count}* активных (ср. ${report.goals.averageProgress}%)\n` +
    `🍽 Калории: *${report.nutrition.calories}* / ${report.nutrition.calorieGoal} (${report.nutrition.caloriePercent}%)`
  )
}

export function formatSettingsMessage(linked: LinkedUser): string {
  const quiet =
    linked.quietHoursStart && linked.quietHoursEnd
      ? `${linked.quietHoursStart.slice(0, 5)}–${linked.quietHoursEnd.slice(0, 5)}`
      : 'не заданы'

  return (
    `⚙️ *Настройки Telegram*\n\n` +
    `Тайм-зона: \`${linked.timezone}\`\n` +
    `Тихие часы: ${quiet}\n\n` +
    `_Полное редактирование — в веб-приложении → «Настройки»._`
  )
}

export function formatWelcomeLinked(firstName: string): string {
  return (
    `С возвращением, ${escapeMarkdown(firstName)}! 👋\n\n` +
    'Аккаунт подключён. Выберите раздел в меню или команду:\n' +
    '/habits · /goals · /nutrition · /report · /reminders · /settings · /help'
  )
}

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  return '▓'.repeat(filled) + '░'.repeat(10 - filled)
}
