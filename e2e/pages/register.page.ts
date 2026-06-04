import { expect, type Page } from '@playwright/test'

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/register', { waitUntil: 'domcontentloaded' })
    await expect(this.page.getByTestId('auth-loading')).toHaveCount(0, { timeout: 60_000 })
    await expect(this.page.getByTestId('auth-register-submit')).toBeVisible({ timeout: 30_000 })
  }

  async signUp(params: { name: string; email: string; password: string }) {
    await this.page.getByTestId('auth-register-name').fill(params.name)
    await this.page.getByTestId('auth-register-email').fill(params.email)
    await this.page.getByTestId('auth-register-password').fill(params.password)
    await this.page.getByTestId('auth-register-submit').click()
    const errorBanner = this.page.locator('form p').filter({
      hasText: /invalid|ошибк|уже зарегистрирован|не ответил/i,
    })
    await Promise.race([
      this.page.waitForURL(/\/(onboarding|login|register)/, { timeout: 45_000 }),
      errorBanner.first().waitFor({ state: 'visible', timeout: 45_000 }).then(async () => {
        const text = (await errorBanner.first().textContent()) ?? 'unknown auth error'
        throw new Error(`Registration failed: ${text}`)
      }),
    ])
  }
}

