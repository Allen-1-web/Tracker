import { expect, type Page } from '@playwright/test'

export class RemindersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/reminders')
    await expect(this.page.getByTestId('reminders-page')).toBeVisible()
    await expect(this.page.getByTestId('reminders-panel')).toBeVisible()
  }

  async createDailyReminder(params: { title: string; time: string }) {
    await this.page.getByTestId('reminder-title').fill(params.title)
    await this.page.getByTestId('reminder-time').fill(params.time)
    await this.page.getByTestId('reminder-create').click()
  }

  async expectReminderVisible(title: string) {
    await expect(this.page.getByTestId('reminder-item').filter({ hasText: title })).toBeVisible()
  }
}
