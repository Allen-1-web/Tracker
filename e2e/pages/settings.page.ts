import { expect, type Page } from '@playwright/test'

export class SettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/settings')
    await expect(this.page.getByRole('heading', { name: 'Настройки' })).toBeVisible()
  }

  async toggleDailySummary() {
    const toggle = this.page.getByTestId('notif-daily-summary-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()
  }

  async setDailySummaryTime(value: string) {
    await this.page.getByTestId('notif-daily-summary-time').fill(value)
    // blur triggers PATCH as well
    await this.page.getByTestId('notif-daily-summary-time').blur()
  }

  async createDailyReminder(params: { title: string; time: string }) {
    await this.page.getByTestId('reminder-title').fill(params.title)
    await this.page.getByTestId('reminder-time').fill(params.time)
    await this.page.getByTestId('reminder-create').click()
  }

  async toggleFirstReminder() {
    const toggle = this.page.getByTestId('reminder-item-toggle').first()
    await expect(toggle).toBeVisible()
    await toggle.click()
  }

  async expectReminderVisible(title: string) {
    await expect(this.page.getByTestId('reminder-item').filter({ hasText: title })).toBeVisible()
  }

  /** Timezone и quiet hours — только при подключённом Telegram. */
  async configureTelegramQuietHoursIfConnected(params: {
    timezoneLabel?: string
    quietStart: string
    quietEnd: string
  }) {
    const panel = this.page.getByTestId('telegram-preferences-panel')
    if (!(await panel.isVisible())) return false

    if (params.timezoneLabel) {
      await this.page.getByTestId('telegram-timezone-trigger').click()
      await this.page.getByRole('option', { name: params.timezoneLabel }).click()
    }

    const toggle = this.page.getByTestId('telegram-quiet-hours-toggle')
    const enabled = await toggle.isChecked()
    if (!enabled) await toggle.click()

    await this.page.getByTestId('telegram-quiet-start').fill(params.quietStart)
    await this.page.getByTestId('telegram-quiet-end').fill(params.quietEnd)
    await this.page.getByTestId('telegram-quiet-end').blur()
    return true
  }
}

