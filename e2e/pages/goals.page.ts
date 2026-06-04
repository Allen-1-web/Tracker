import { expect, type Page } from '@playwright/test'

export class GoalsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/goals')
    await expect(this.page.getByRole('heading', { name: 'Цели' })).toBeVisible()
  }

  async openAddGoal() {
    await this.page.getByTestId('goals-add-open').click()
    await expect(this.page.getByRole('heading', { name: 'Новая цель' })).toBeVisible()
  }

  async createNumericGoal(params: {
    name: string
    target: number
    unit: string
    linkHabitNames?: string[]
  }) {
    await this.openAddGoal()
    await this.page.getByTestId('goal-form-name').fill(params.name)
    await this.page.getByTestId('goal-form-target').fill(String(params.target))
    await this.page.getByTestId('goal-form-unit').fill(params.unit)
    // tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 7)
    const iso = tomorrow.toISOString().split('T')[0]!
    await this.page.getByTestId('goal-form-deadline').fill(iso)

    await this.page.getByTestId('goal-form-category-trigger').click()
    await this.page.getByRole('option').first().click()

    if (params.linkHabitNames?.length) {
      const dialog = this.page.getByRole('dialog', { name: 'Новая цель' })
      await expect(dialog.getByText('Связанные привычки')).toBeVisible({ timeout: 15_000 })
      for (const habitName of params.linkHabitNames) {
        const row = dialog.locator('label').filter({ hasText: habitName })
        await row.locator('input[type="checkbox"]').check()
      }
    }

    await this.page.getByTestId('goal-form-submit').click()
  }

  async expectLinkedHabitsOnDetail(...habitNames: string[]) {
    const list = this.page.getByTestId('goal-linked-habits-list')
    await expect(list).toBeVisible()
    for (const name of habitNames) {
      await expect(list.getByText(name)).toBeVisible()
    }
  }

  async openGoalByName(name: string) {
    await this.page.getByRole('link', { name: new RegExp(name) }).first().click()
    await expect(this.page.locator('main h2').filter({ hasText: name })).toBeVisible()
  }

  async addProgress(value: number) {
    await this.page.getByTestId('goal-add-progress-open').click()
    await this.page.getByTestId('goal-progress-value').fill(String(value))
    await this.page.getByTestId('goal-progress-submit').click()
  }

  async expectProgressUpdated() {
    await expect(this.page.getByText('%')).toBeVisible()
    await expect(this.page.getByRole('heading', { name: 'Лента прогресса' })).toBeVisible()
  }
}

