import { DateTime } from 'luxon'
import cronParser from 'cron-parser'

/** Проверка валидности IANA TZ через Intl. */
export function isValidTimezone(tz: string): boolean {
  if (!tz || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Парсинг 'HH:mm' или 'HH:mm:ss' → { hour, minute }. */
export function parseTimeOfDay(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function formatTimeOfDay(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/**
 * Проверка quiet hours.
 * Поддерживает интервалы через полночь (например 22:00 → 07:00).
 */
export function isWithinQuietHours(args: {
  timezone: string
  quietStart: string | null
  quietEnd: string | null
  now?: Date
}): boolean {
  const { timezone, quietStart, quietEnd, now } = args
  if (!quietStart || !quietEnd) return false
  const start = parseTimeOfDay(quietStart)
  const end = parseTimeOfDay(quietEnd)
  if (!start || !end) return false

  const dt = DateTime.fromJSDate(now ?? new Date(), { zone: timezone })
  if (!dt.isValid) return false

  const cur = dt.hour * 60 + dt.minute
  const s = start.hour * 60 + start.minute
  const e = end.hour * 60 + end.minute

  if (s === e) return false
  if (s < e) return cur >= s && cur < e
  return cur >= s || cur < e
}

/** Валидность 5-полевого cron в указанной TZ. */
export function isValidCron(expression: string, timezone: string): boolean {
  if (!isValidTimezone(timezone)) return false
  try {
    cronParser.parseExpression(expression, { tz: timezone })
    return true
  } catch {
    return false
  }
}

/** Ближайшее следующее срабатывание cron в TZ или null при некорректном выражении. */
export function nextRunOf(expression: string, timezone: string, after?: Date): Date | null {
  try {
    const it = cronParser.parseExpression(expression, {
      tz: timezone,
      currentDate: after ?? new Date(),
    })
    return it.next().toDate()
  } catch {
    return null
  }
}

/**
 * Хелперы перевода времени из локального TZ пользователя в UTC и обратно.
 */
export function localTimeToCron(
  hour: number,
  minute: number,
  options: { dow?: number; dom?: number; month?: number } = {}
): string {
  const dom = options.dom ?? '*'
  const month = options.month ?? '*'
  const dow = options.dow ?? '*'
  return `${minute} ${hour} ${dom} ${month} ${dow}`
}

/** Текущий момент в указанной TZ как ISO. */
export function nowInZone(tz: string): string {
  return DateTime.now().setZone(tz).toISO() ?? new Date().toISOString()
}

/** Совпадает ли текущая минута с HH:mm в TZ (для scheduler tick раз в минуту). */
export function isScheduledMinute(now: Date, timezone: string, timeOfDay: string): boolean {
  const parsed = parseTimeOfDay(timeOfDay)
  if (!parsed || !isValidTimezone(timezone)) return false
  const dt = DateTime.fromJSDate(now, { zone: timezone })
  if (!dt.isValid) return false
  return dt.hour === parsed.hour && dt.minute === parsed.minute
}

/** 0 = воскресенье, как в JS getDay() / notification_preferences.weekly_report_dow. */
export function dayOfWeekInZone(now: Date, timezone: string): number {
  const dt = DateTime.fromJSDate(now, { zone: timezone })
  return dt.isValid ? dt.weekday % 7 : new Date(now).getDay()
}

/** Текущее время в минутах от полуночи в TZ. */
export function minutesOfDayInZone(now: Date, timezone: string): number | null {
  const dt = DateTime.fromJSDate(now, { zone: timezone })
  if (!dt.isValid) return null
  return dt.hour * 60 + dt.minute
}

/** Интервал [start, end) в минутах от полуночи; поддерживает переход через полночь. */
export function isWithinMinuteWindow(
  nowMinutes: number,
  startMinutes: number,
  endMinutes: number,
): boolean {
  if (startMinutes === endMinutes) return false
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes
  return nowMinutes >= startMinutes || nowMinutes < endMinutes
}

export function startOfDayInZone(now: Date, timezone: string): Date {
  return DateTime.fromJSDate(now, { zone: timezone }).startOf('day').toJSDate()
}

/** Сегодняшний момент рассылки (HH:mm) в TZ пользователя. */
export function scheduledTimeToday(now: Date, timezone: string, timeOfDay: string): Date | null {
  const parsed = parseTimeOfDay(timeOfDay)
  if (!parsed || !isValidTimezone(timezone)) return null
  const dt = DateTime.fromJSDate(now, { zone: timezone })
  if (!dt.isValid) return null
  return dt
    .startOf('day')
    .set({ hour: parsed.hour, minute: parsed.minute, second: 0, millisecond: 0 })
    .toJSDate()
}

/**
 * Время рассылки уже наступило сегодня в TZ пользователя.
 * Надёжнее exact-minute match: не пропускает, если worker tick чуть позже или prefs обновили после времени.
 */
export function isPastScheduledTimeToday(now: Date, timezone: string, timeOfDay: string): boolean {
  const scheduled = scheduledTimeToday(now, timezone, timeOfDay)
  if (!scheduled) return false
  return now >= scheduled
}
