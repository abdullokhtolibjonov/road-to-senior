import { expect, test } from '../fixtures/test'

test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await inventoryPage.expectLoaded()
})

test('add 2 items to cart and remove 1 of them from cart', async ({ cartPage, inventoryPage }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack')
    await inventoryPage.addToCart('Sauce Labs Bike Light')
    await expect(inventoryPage.headerComponent.cartBadge).toHaveText('2')

    await inventoryPage.headerComponent.cartButton.click()
    await cartPage.expectLoaded()

    await expect(cartPage.itemNames).toHaveText(['Sauce Labs Backpack', 'Sauce Labs Bike Light'])

    await cartPage.remove('Sauce Labs Bike Light')
    await expect(cartPage.itemNames).toHaveText(['Sauce Labs Backpack'])
})