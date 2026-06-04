import { InlineKeyboard } from 'grammy'
import { DateTime } from 'luxon'
import type { ReminderSchedule } from '../../domain/reminder.js'
import { escapeMarkdown } from '../../shared/telegram/markdown.js'
import { reminderToggleCallback } from '../../shared/validation/callbacks.js'

const KIND_LABELS: Record<ReminderSchedule['kind'], string> = {
  habit: '📋',
  goal: '🎯',
  nutrition: '🍽',
  water: '💧',
  sleep: '😴',
  workout: '🏋️',
  custom: '⏰',
}

export function remindersKeyboard(items: ReminderSchedule[]): InlineKeyboard {
  const kb = new InlineKeyboard()
  items.forEach((item, index) => {
    const mark = item.enabled ? '🔔' : '🔕'
    const icon = KIND_LABELS[item.kind] ?? '⏰'
    const label = `${mark} ${icon} ${item.title}`.slice(0, 60)
    if (index > 0) kb.row()
    kb.text(label, reminderToggleCallback(item.id))
  })
  kb.row().text('« Меню', 'm:home')
  return kb
}

export function formatRemindersMessage(items: ReminderSchedule[]): string {
  if (items.length === 0) {
    return (
      '⏰ *Напоминания*\n\n' +
      'Пока нет расписаний.\n\n' +
      'Добавьте ежедневное напоминание:\n' +
      '`/reminders add 09:00 Проверить привычки`\n\n' +
      '_Или включите напоминания в веб-приложении → «Настройки»._'
    )
  }

  const lines = items.map((item) => {
    const icon = KIND_LABELS[item.kind] ?? '⏰'
    const status = item.enabled ? '🔔 вкл' : '🔕 выкл'
    const next = formatNextRun(item)
    return `• ${icon} *${escapeMarkdown(item.title)}* — ${status}\n  _${next}_`
  })

  return (
    '⏰ *Напоминания*\n\n' +
    lines.join('\n\n') +
    '\n\n_Нажмите кнопку, чтобы вкл/выкл. Добавить: `/reminders add HH:MM Текст`_'
  )
}

function formatNextRun(item: ReminderSchedule): string {
  if (!item.enabled) return 'отключено'
  if (!item.nextRunAt) return 'следующий запуск не запланирован'
  const dt = DateTime.fromJSDate(item.nextRunAt).setZone(item.timezone)
  if (!dt.isValid) return item.nextRunAt.toISOString()
  return `следующее: ${dt.setLocale('ru').toFormat('d MMM, HH:mm')}`
}
