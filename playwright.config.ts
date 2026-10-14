import { defineConfig, devices } from '@playwright/test'
import { authFile } from './e2e/test-data/users';

export default defineConfig({
  testDir: 'e2e/tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  reporter: 'html',
  retries: process.env.CI ? 2: 0,
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    //headless: false,
    testIdAttribute: 'data-test'
  },

  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: authFile('standardUser')
    },
    dependencies: ['setup']
  }, {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      storageState: authFile('standardUser')
    },
    dependencies: ['setup']
  }, {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  }]
})