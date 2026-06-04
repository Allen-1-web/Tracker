import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import dotenv from 'dotenv'

// Env strategy:
// - Default: load `e2e/.env.e2e` if exists
// - Override with `E2E_ENV_FILE=...`
const envFile = process.env.E2E_ENV_FILE ?? path.resolve(process.cwd(), 'e2e/.env.e2e')
dotenv.config({ path: envFile, override: true })

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3099'
const useStorageState = process.env.E2E_USE_STORAGE_STATE === '1'
const storageStatePath = path.resolve(process.cwd(), 'e2e/.auth/storageState.json')

export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/test-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    // We rely on stable data-testids when present.
    testIdAttribute: 'data-testid',
  },
  ...(process.env.E2E_NO_WEB_SERVER !== '1'
    ? {
        webServer: {
          command: 'node e2e/scripts/start-web.mjs',
          url: baseURL,
          reuseExistingServer:
            process.env.E2E_REUSE_SERVER === '1' ||
            (process.env.E2E_REUSE_SERVER !== '0' && !process.env.CI),
          timeout: 300_000,
          cwd: process.cwd(),
          env: {
            ...process.env,
            SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.E2E_SUPABASE_URL ?? '',
            SUPABASE_ANON_KEY:
              process.env.SUPABASE_ANON_KEY ?? process.env.E2E_SUPABASE_ANON_KEY ?? '',
            TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME ?? '',
            E2E_TESTING: process.env.E2E_TESTING ?? (process.env.CI ? '1' : '0'),
          },
        },
      }
    : {}),
  projects: [
    ...(useStorageState
      ? [
          {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
            use: { ...devices['Desktop Chrome'] },
          },
        ]
      : []),
    {
      name: 'chromium',
      ...(useStorageState ? { dependencies: ['setup'] } : {}),
      use: {
        ...devices['Desktop Chrome'],
        ...(useStorageState ? { storageState: storageStatePath } : {}),
      },
    },
    // Extend later if needed:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})

