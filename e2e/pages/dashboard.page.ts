import { expect, type Page } from '@playwright/test'

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
    await expect(this.page.getByTestId('dashboard-daily-progress')).toBeVisible()
  }

  async expectWidgetsVisible() {
    await expect(this.page.getByTestId('dashboard-habits-widget')).toBeVisible()
    await expect(this.page.getByTestId('dashboard-streak-widget')).toBeVisible()
    await expect(this.page.getByTestId('dashboard-goals-widget')).toBeVisible()
    await expect(this.page.getByTestId('dashboard-nutrition-widget')).toBeVisible()
  }
}
