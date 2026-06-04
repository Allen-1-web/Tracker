import { expect, type Page } from '@playwright/test'

export class OnboardingPage {
  constructor(private readonly page: Page) {}

  async expectAt() {
    await expect(this.page.getByTestId('onboarding-root')).toBeVisible()
    await this.waitForCategories()
  }

  /** Дождаться сидов категорий после signup (иначе addHabit в онбординге зависает). */
  async waitForCategories() {
    await expect
      .poll(
        async () => {
          await this.page.getByTestId('onboarding-habit-category-trigger').click()
          const n = await this.page.getByRole('option').count()
          await this.page.keyboard.press('Escape')
          return n
        },
        { timeout: 60_000 }
      )
      .toBeGreaterThan(0)
  }

  async completeMinimalFlow() {
    await this.page.getByTestId('onboarding-habit-name').fill('E2E Habit')
    await this.page.getByRole('button', { name: '🏋️' }).click()
    await this.page.getByTestId('onboarding-habit-category-trigger').click()
    await this.page.getByRole('option').first().click()

    await this.page.getByTestId('onboarding-habit-next').click()
    await expect(this.page.getByRole('heading', { name: 'Поставь первую цель' })).toBeVisible({
      timeout: 60_000,
    })

    await this.page.getByTestId('onboarding-goal-skip').click()
    await expect(this.page.getByRole('heading', { name: /Telegram/i })).toBeVisible({ timeout: 15_000 })

    await this.page.getByTestId('onboarding-telegram-finish').click()
  }
}
