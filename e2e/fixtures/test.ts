import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { CartPage } from '../pages/CartPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';

type MyFixtures = {
    loginPage: LoginPage,
    cartPage: CartPage,
    checkoutPage: CheckoutPage,
    checkoutOverviewPage: CheckoutOverviewPage,
    inventoryPage: InventoryPage,
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
    }
})

export { expect } from '@playwright/test'