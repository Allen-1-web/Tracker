import { expect, type Page } from '@playwright/test'
import { createConfirmedUser, findUserIdByEmail, confirmUserEmailById } from './supabase-admin'
import { waitForAuthReady } from './wait-auth'
import { RegisterPage } from '../pages/register.page'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await waitForAuthReady(page)
  await page.getByTestId('auth-login-email').fill(email)
  await page.getByTestId('auth-login-password').fill(password)
  await page.getByTestId('auth-login-submit').click()
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 30_000 })
}

function authErrorText(page: Page) {
  return page.locator('form p').filter({
    hasText: /invalid|ошибк|уже зарегистрирован|rate limit|не ответил/i,
  })
}

/**
 * Регистрация через UI; при rate limit или отсутствии сессии — admin createUser + login.
 */
export async function registerNewUser(
  page: Page,
  params: { name: string; email: string; password: string }
): Promise<'ui' | 'admin'> {
  const register = new RegisterPage(page)
  await register.goto()
  await register.signUp(params)

  const err = authErrorText(page)
  if (await err.first().isVisible().catch(() => false)) {
    const text = (await err.first().textContent()) ?? ''
    if (/rate limit/i.test(text)) {
      await createConfirmedUser(params)
      await login(page, params.email, params.password)
      return 'admin'
    }
    throw new Error(`Registration failed: ${text}`)
  }

  return 'ui'
}

/** После регистрации — оказаться на /onboarding. */
export async function completeSignupToOnboarding(page: Page, email: string, password: string) {
  if (page.url().includes('/onboarding')) return

  const confirmBanner = page.getByText('Подтвердите email', { exact: false })
  const onLogin = page.url().includes('/login')
  const needsConfirm =
    onLogin ||
    (await confirmBanner.isVisible().catch(() => false)) ||
  (!(await findUserIdByEmail(email)) && page.url().includes('/register'))

  if (needsConfirm || onLogin) {
    let userId = await findUserIdByEmail(email)
    if (!userId) {
      await createConfirmedUser({ email, password, name: 'E2E User' })
      userId = await findUserIdByEmail(email)
    }
    if (userId) await confirmUserEmailById(userId)
    if (!page.url().includes('/onboarding')) {
      await login(page, email, password)
    }
  }

  if (!page.url().includes('/onboarding')) {
    await page.goto('/onboarding')
  }
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 })
}
