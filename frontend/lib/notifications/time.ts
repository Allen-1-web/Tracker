/** PostgreSQL `time` → 'HH:mm' для `<input type="time">`. */
export function formatTimeOfDay(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value)
  if (!match) return '09:00'
  return `${match[1]!.padStart(2, '0')}:${match[2]!}`
}

/** 'HH:mm' или 'HH:mm:ss' → { hour, minute }. */
export function parseTimeOfDay(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

/** Человекочитаемое время из daily cron `M H * * *`. */
export function cronToTimeLabel(cron: string): string | null {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const minute = Number(parts[0])
  const hour = Number(parts[1])
  if (!Number.isFinite(minute) || !Number.isFinite(hour)) return null
  if (parts[2] !== '*' || parts[3] !== '*' || parts[4] !== '*') return cron
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Воскресенье' },
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
] as const

export const TIMEZONE_OPTIONS = [
  'Europe/Moscow',
  'Europe/Kaliningrad',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Kamchatka',
  'UTC',
] as const

export function isValidTimezone(tz: string): boolean {
  if (!tz || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}
