import { test as setup } from '../fixtures/test'

export const STANDARD_AUTH_FILE = 'playwright/.auth/standard.json'

setup('authenticate as a standard user', async({ page, loginPage, inventoryPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await inventoryPage.expectLoaded()
    await page.context().storageState({ path: STANDARD_AUTH_FILE })
})