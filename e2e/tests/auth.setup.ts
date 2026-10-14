import { test as setup } from '../fixtures/test'
import { LOGIN_ROLES, authFile } from '../test-data/users'

for (const role of LOGIN_ROLES) {
    setup(`authenticate as ${role}`, async({ page, loginPage, inventoryPage }) => {
        await loginPage.goto()
        await loginPage.loginAs(role)
        await inventoryPage.expectLoaded()
        await page.context().storageState({ path: authFile(role) })
    })
}