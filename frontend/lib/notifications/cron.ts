import cronParser from 'cron-parser'
import { isValidTimezone } from './time'

export function localTimeToCron(hour: number, minute: number): string {
  return `${minute} ${hour} * * *`
}

export function nextRunOf(cron: string, timezone: string, after?: Date): Date | null {
  if (!isValidTimezone(timezone)) return null
  try {
    const it = cronParser.parseExpression(cron, {
      tz: timezone,
      currentDate: after ?? new Date(),
    })
    return it.next().toDate()
  } catch {
    return null
  }
}
