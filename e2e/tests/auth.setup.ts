import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const storageStatePath = path.resolve(process.cwd(), 'e2e/.auth/storageState.json')

setup('auth storageState', async ({ page }) => {
  const email = process.env.E2E_EXISTING_USER_EMAIL
  const password = process.env.E2E_EXISTING_USER_PASSWORD
  if (!email || !password) {
    setup.skip(true, 'E2E_EXISTING_USER_EMAIL/PASSWORD not set')
  }

  await page.goto('/login')
  await expect(page.getByTestId('auth-login-submit')).toBeVisible()

  await page.getByTestId('auth-login-email').fill(email)
  await page.getByTestId('auth-login-password').fill(password)
  await page.getByTestId('auth-login-submit').click()

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })

  await fs.mkdir(path.dirname(storageStatePath), { recursive: true })
  await page.context().storageState({ path: storageStatePath })
})

