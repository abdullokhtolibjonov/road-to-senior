import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  reporter: 'html',
  

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
    use: { ...devices['Desktop Chrome'] },
  }]
})