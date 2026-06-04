import { expect, type Page } from '@playwright/test'

export class NutritionPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/nutrition')
    await expect(this.page.getByRole('heading', { name: 'Питание' })).toBeVisible()
  }

  async addMealEntry() {
    // Pick first suggested food and add 100g lunch.
    await this.page.getByTestId('nutrition-food-query').click()
    const chip = this.page.getByTestId('nutrition-food-chip').first()
    await expect(chip).toBeVisible()
    await chip.click()

    await this.page.getByTestId('nutrition-amount').fill('100')
    await this.page.getByTestId('nutrition-meal-lunch').click()
    await this.page.getByTestId('nutrition-add').click()
  }

  async expectTotalsVisible() {
    await expect(this.page.getByTestId('nutrition-summary')).toBeVisible()
  }
}

