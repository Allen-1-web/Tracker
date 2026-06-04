import { DateTime } from 'luxon'

/** 'YYYY-MM-DD' в IANA TZ пользователя. */
export function todayInZone(timezone: string, now: Date = new Date()): string {
  const dt = DateTime.fromJSDate(now, { zone: timezone })
  return dt.isValid ? dt.toISODate()! : DateTime.fromJSDate(now).toISODate()!
}

export function formatRuDate(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate)
  return dt.isValid ? dt.setLocale('ru').toFormat('d MMMM') : isoDate
}
