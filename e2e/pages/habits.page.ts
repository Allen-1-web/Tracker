import { expect, type Page } from '@playwright/test'

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const

export class HabitsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/habits')
    await expect(this.page.getByRole('heading', { name: 'Привычки' })).toBeVisible()
  }

  async openAddHabit() {
    await this.page.getByTestId('habits-add-open').click()
    await expect(this.page.getByRole('heading', { name: 'Новая привычка' })).toBeVisible()
  }

  async createHabit(params: {
    name: string
    categoryName?: string
    frequency?: 'daily' | 'custom'
    customDays?: number[]
  }) {
    await this.openAddHabit()
    await this.page.getByTestId('habit-form-name').fill(params.name)
    // Pick first icon/color to keep test deterministic
    await this.page.getByTestId('habit-form-icon-0').click()
    await this.page.getByTestId('habit-form-color-0').click()

    await this.page.getByTestId('habit-form-category-trigger').click()
    if (params.categoryName) {
      await this.page.getByRole('option', { name: new RegExp(params.categoryName) }).click()
    } else {
      // Fallback: pick first option
      await this.page.getByRole('option').first().click()
    }

    if (params.frequency === 'custom') {
      await this.page.getByTestId('habit-form-frequency-custom').click()
      const days = params.customDays ?? [1, 3, 5]
      const dialog = this.page.getByRole('dialog', { name: 'Новая привычка' })
      for (const dayIndex of days) {
        const label = WEEKDAY_LABELS[dayIndex]
        if (!label) continue
        await dialog.getByRole('button', { name: label, exact: true }).click()
      }
    } else {
      await this.page.getByTestId('habit-form-frequency-daily').click()
    }
    await this.page.getByTestId('habit-form-submit').click()
  }

  async toggleHabitDoneByName(name: string) {
    const card = this.page.getByTestId('habit-card').filter({ hasText: name })
    await expect(card).toBeVisible()
    await card.getByTestId('habit-toggle-today').click()
  }

  async expectStreakVisibleOnCard(name: string) {
    const card = this.page.getByTestId('habit-card').filter({ hasText: name })
    await expect(card.getByTestId('habit-streak')).toBeVisible()
  }
}

