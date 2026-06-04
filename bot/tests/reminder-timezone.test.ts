import { describe, it, expect } from 'vitest'
import {
  isWithinQuietHours,
  isValidCron,
  localTimeToCron,
  nextRunOf,
  parseTimeOfDay,
  isScheduledMinute,
  isPastScheduledTimeToday,
  scheduledTimeToday,
  dayOfWeekInZone,
  isWithinMinuteWindow,
  minutesOfDayInZone,
} from '../src/shared/time/timezone.js'
import { NotificationPreferencesRepository } from '../src/infrastructure/supabase/repositories/notification-preferences.repository.js'
import type { NotificationPreferences } from '../src/domain/notification.js'

describe('timezone helpers', () => {
  it('parseTimeOfDay accepts HH:mm', () => {
    expect(parseTimeOfDay('09:30')).toEqual({ hour: 9, minute: 30 })
    expect(parseTimeOfDay('invalid')).toBeNull()
  })

  it('localTimeToCron builds daily cron', () => {
    expect(localTimeToCron(9, 0)).toBe('0 9 * * *')
  })

  it('isValidCron validates in timezone', () => {
    expect(isValidCron('0 9 * * *', 'Europe/Moscow')).toBe(true)
    expect(isValidCron('not a cron', 'Europe/Moscow')).toBe(false)
  })

  it('nextRunOf returns future date', () => {
    const anchor = new Date('2026-05-24T00:00:00Z')
    const next = nextRunOf('0 9 * * *', 'Europe/Moscow', anchor)
    expect(next).toBeInstanceOf(Date)
    expect(next!.getTime()).toBeGreaterThan(anchor.getTime())
  })

  it('isWithinQuietHours handles overnight window', () => {
    const noon = new Date('2026-05-24T09:00:00Z') // 12:00 Moscow
    expect(
      isWithinQuietHours({
        timezone: 'Europe/Moscow',
        quietStart: '22:00',
        quietEnd: '07:00',
        now: noon,
      }),
    ).toBe(false)
  })

  it('isScheduledMinute matches exact minute in TZ', () => {
    const at930 = new Date('2026-05-24T06:30:00Z') // 09:30 Moscow
    expect(isScheduledMinute(at930, 'Europe/Moscow', '09:30')).toBe(true)
    expect(isScheduledMinute(at930, 'Europe/Moscow', '09:31')).toBe(false)
  })

  it('isWithinMinuteWindow supports hydration hours', () => {
    expect(isWithinMinuteWindow(600, 540, 1260)).toBe(true) // 10:00 in 09:00-21:00
    expect(isWithinMinuteWindow(300, 540, 1260)).toBe(false)
  })

  it('minutesOfDayInZone returns local minutes', () => {
    const at930 = new Date('2026-05-24T06:30:00Z')
    expect(minutesOfDayInZone(at930, 'Europe/Moscow')).toBe(9 * 60 + 30)
  })

  it('dayOfWeekInZone returns Sunday as 0', () => {
    const sunday = new Date('2026-05-24T10:00:00Z')
    expect(dayOfWeekInZone(sunday, 'Europe/Moscow')).toBe(0)
  })

  it('isPastScheduledTimeToday true after scheduled time same day', () => {
    const at959 = new Date('2026-05-24T06:59:00Z') // 09:59 Moscow — after 07:54
    expect(isPastScheduledTimeToday(at959, 'Europe/Moscow', '07:54:00')).toBe(true)
    const at700 = new Date('2026-05-24T04:00:00Z') // 07:00 Moscow — before 07:54
    expect(isPastScheduledTimeToday(at700, 'Europe/Moscow', '07:54')).toBe(false)
  })

  it('scheduledTimeToday anchors idempotency to slot not midnight', () => {
    const at812 = new Date('2026-05-24T05:12:00Z') // 08:12 Moscow
    const slot827 = scheduledTimeToday(at812, 'Europe/Moscow', '08:27')!
    expect(slot827.getTime()).toBeGreaterThan(at812.getTime())
    // send at 08:12 must not count as "after 08:27 slot"
    expect(at812 >= slot827).toBe(false)
  })
})

describe('NotificationPreferencesRepository.isKindEnabled', () => {
  const repo = new NotificationPreferencesRepository(null as never)

  const base: NotificationPreferences = {
    userId: 'u1',
    dailySummary: true,
    dailySummaryTime: '20:00',
    weeklyReport: true,
    weeklyReportDow: 0,
    weeklyReportTime: '20:00',
    hydration: false,
    hydrationIntervalMinutes: 120,
    hydrationStartTime: '09:00',
    hydrationEndTime: '21:00',
    nutritionReminders: true,
    habitReminders: true,
    goalDeadlineReminders: true,
    missedHabitAlerts: true,
    updatedAt: new Date(),
  }

  it('respects kind-specific toggles', () => {
    expect(repo.isKindEnabled(base, 'habit')).toBe(true)
    expect(repo.isKindEnabled({ ...base, habitReminders: false }, 'habit')).toBe(false)
    expect(repo.isKindEnabled({ ...base, hydration: false }, 'water')).toBe(false)
    expect(repo.isKindEnabled(base, 'custom')).toBe(true)
  })
})
