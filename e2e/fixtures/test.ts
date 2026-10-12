import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { CartPage } from '../pages/CartPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage'

type MyFixtures = {
    loginPage: LoginPage,
    cartPage: CartPage,
    checkoutPage: CheckoutPage,
    checkoutOverviewPage: CheckoutOverviewPage,
    checkoutCompletePage: CheckoutCompletePage,
    inventoryPage: InventoryPage,
    loggedIn: void
}

export const test = base.extend<MyFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page))
    },
    cartPage: async ({ page }, use) => {
        await use(new CartPage(page))
    },
    checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page))
    },
    checkoutOverviewPage: async ({ page }, use) => {
        await use(new CheckoutOverviewPage(page))
    },
    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page))
    },
    checkoutCompletePage: async ({ page }, use) => {
        await use(new CheckoutCompletePage(page))
    },
    loggedIn: async({ loginPage, inventoryPage }, use) => {
        await loginPage.goto()
        await loginPage.loginAs('standardUser')
        await inventoryPage.expectLoaded()
        await use()
    }
})

export { expect } from '@playwright/test'