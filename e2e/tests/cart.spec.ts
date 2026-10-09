import { expect, test } from '../fixtures/test'

test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await inventoryPage.expectLoaded()
})

test('add 2 items to cart to cart and remove 1 of them on cart', async ({ cartPage, inventoryPage }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack')
    await inventoryPage.addToCart('Sauce Labs Bike Light')
    await expect(inventoryPage.headerComponent.cartBadge).toHaveText('2')

    await inventoryPage.headerComponent.cartButton.click()
    const itemNames = await inventoryPage.getNames()

    expect(itemNames).toEqual(expect.arrayContaining(['Sauce Labs Backpack', 'Sauce Labs Bike Light']))

    await cartPage.remove('Sauce Labs Bike Light')
    const remainingItemNames = await cartPage.getNames()
    expect(remainingItemNames).toEqual(['Sauce Labs Backpack'])
})