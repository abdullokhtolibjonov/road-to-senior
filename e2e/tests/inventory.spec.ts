import { expect, test } from '../fixtures/test'

test.beforeEach(async ({ loginPage ,inventoryPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await inventoryPage.expectLoaded()
})

test('Add a product to cart and remove it, verify badge count', async ({ inventoryPage }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack')
    await expect(inventoryPage.headerComponent.cartBadge).toHaveText('1')

    await inventoryPage.remove('Sauce Labs Backpack')
    await expect(inventoryPage.headerComponent.cartBadge).toBeHidden()
})