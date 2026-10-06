import { test, expect } from '../fixtures/test'

test('login as standard user', async ({ page, loginPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await expect(page).toHaveURL('/inventory.html')
})
