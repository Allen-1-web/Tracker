import { expect, type Page } from '@playwright/test'

const readyLocator = (page: Page) =>
  page
    .getByTestId('app-auth-ready')
    .or(page.getByTestId('auth-register-submit'))
    .or(page.getByTestId('auth-login-submit'))
    .or(page.getByTestId('onboarding-root'))

/** Дождаться окончания AuthBootstrap (спиннер «Загрузка...» исчез, UI интерактивен). */
export async function waitForAuthReady(page: Page) {
  await expect(page.getByTestId('auth-loading')).toHaveCount(0, { timeout: 60_000 })
  await expect(readyLocator(page).first()).toBeVisible({ timeout: 60_000 })
}
