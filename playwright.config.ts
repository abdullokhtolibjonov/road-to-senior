import { defineConfig, devices } from '@playwright/test'
import { authFile } from './e2e/test-data/users';

export default defineConfig({
  testDir: 'e2e/tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  globalSetup: './shared/global-setup.ts',
  // list = live progress in the terminal, html = the report to read after the run
  // (open it with `npx playwright show-report`). CI adds inline PR annotations (github) and
  // a JUnit XML file that CI tools can parse. allure-playwright writes raw results to
  // allure-results/; `npm run report:allure` turns them into a report.
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['allure-playwright', { resultsDir: 'allure-results' }], ['github'], ['junit', { outputFile: 'results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }], ['allure-playwright', { resultsDir: 'allure-results' }]],
  retries: process.env.CI ? 2: 0,
  use: {
    baseURL: 'https://www.saucedemo.com',
    // Locally there are no retries, so 'on-first-retry' never recorded a trace for a local failure.
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
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
  }, {
    // API tests: no browser, no login state — just HTTP calls through the `request` fixture.
    name: 'api',
    testDir: 'api/tests',
    // dummyjson: no API key, ~100 requests/minute. (reqres was dropped: 40 requests/day per IP.)
    use: {
      baseURL: 'https://dummyjson.com'
    }
  }]
})