import { test, expect } from '@playwright/test'
import { uniqueEmail, uniqueName } from '../utils/random'
import { cleanupUserByEmail } from '../utils/cleanup'
import { completeSignupToOnboarding, registerNewUser } from '../utils/auth-flow'
import { OnboardingPage } from '../pages/onboarding.page'
import { HabitsPage } from '../pages/habits.page'
import { GoalsPage } from '../pages/goals.page'
import { NutritionPage } from '../pages/nutrition.page'
import { SettingsPage } from '../pages/settings.page'
import { RemindersPage } from '../pages/reminders.page'
import { DashboardPage } from '../pages/dashboard.page'
import { waitForAuthReady } from '../utils/wait-auth'

test.describe('Tracker: real user journey (Supabase Auth + UI)', () => {
  test('signup → onboarding → habits → goals → nutrition → reminders/settings → dashboard → logout/login', async ({
    page,
  }) => {
    const email = uniqueEmail('tracker-e2e')
    const password = 'E2E_password_123!'
    const name = uniqueName('Tracker E2E')

    const clientErrors: string[] = []
    page.on('pageerror', (err) => clientErrors.push(`pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') clientErrors.push(`console.error: ${msg.text()}`)
    })

    try {
      // 1) Registration (UI; admin fallback при Supabase rate limit)
      if (clientErrors.length > 0) {
        console.warn('Client errors detected before signup:', clientErrors.slice(0, 10))
      }
      await registerNewUser(page, { name, email, password })
      await completeSignupToOnboarding(page, email, password)

      // 1b) Onboarding
      const onboarding = new OnboardingPage(page)
      await onboarding.expectAt()
      await onboarding.completeMinimalFlow()

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })

      // 2) Habits
      const habits = new HabitsPage(page)
      await habits.goto()

      const habitName = `E2E Habit ${Math.random().toString(16).slice(2, 6)}`
      const todayDow = new Date().getDay()
      await habits.createHabit({
        name: habitName,
        frequency: 'custom',
        customDays: [todayDow, (todayDow + 2) % 7],
      })
      await habits.toggleHabitDoneByName(habitName)
      await habits.expectStreakVisibleOnCard(habitName)

      // 3) Goals (with habit link)
      const goals = new GoalsPage(page)
      await goals.goto()
      const goalName = `E2E Goal ${Math.random().toString(16).slice(2, 6)}`
      await goals.createNumericGoal({
        name: goalName,
        target: 10,
        unit: 'шт',
        linkHabitNames: [habitName],
      })
      await goals.openGoalByName(goalName)
      await goals.expectLinkedHabitsOnDetail(habitName)
      await goals.addProgress(3)
      await goals.expectProgressUpdated()

      // 4) Nutrition
      const nutrition = new NutritionPage(page)
      await nutrition.goto()
      await nutrition.expectTotalsVisible()
      await nutrition.addMealEntry()
      await nutrition.expectTotalsVisible()

      // 5) Reminders page
      const reminders = new RemindersPage(page)
      await reminders.goto()
      const reminderTitle = `E2E reminder ${Math.random().toString(16).slice(2, 6)}`
      await reminders.createDailyReminder({ title: reminderTitle, time: '09:05' })
      await reminders.expectReminderVisible(reminderTitle)

      // 6) Settings: notification prefs + optional Telegram quiet hours
      const settings = new SettingsPage(page)
      await settings.goto()
      await settings.setDailySummaryTime('21:15')
      await settings.expectReminderVisible(reminderTitle)
      await settings.toggleFirstReminder()
      await settings.configureTelegramQuietHoursIfConnected({
        quietStart: '23:00',
        quietEnd: '07:30',
      })

      // persistence after reload
      await page.reload()
      await waitForAuthReady(page)
      await expect(page.getByTestId('notif-daily-summary-time')).toHaveValue('21:15')
      await expect(page.getByTestId('reminder-item').filter({ hasText: reminderTitle })).toBeVisible()

      // 7) Dashboard widgets
      const dashboard = new DashboardPage(page)
      await dashboard.goto()
      await dashboard.expectWidgetsVisible()

      // 8) Logout/Login again
      await page.goto('/settings')
      await page.getByTestId('settings-logout').click()
      await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })

      await waitForAuthReady(page)
      await page.getByTestId('auth-login-email').fill(email)
      await page.getByTestId('auth-login-password').fill(password)
      await page.getByTestId('auth-login-submit').click()

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
      await dashboard.expectWidgetsVisible()
      await goals.goto()
      await goals.openGoalByName(goalName)
      await goals.expectLinkedHabitsOnDetail(habitName)
    } finally {
      // Supabase cleanup (service role; safe no-op if env missing)
      if (process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_SERVICE_ROLE_KEY) {
        await cleanupUserByEmail(email)
      }
    }
  })
})

