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

test('inventory items price low to high and high to low', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi')

    await expect(inventoryPage.prices.first()).toHaveText('$7.99')

    const prices = await inventoryPage.getPrices()
    const sortedPrices = [...prices].sort((a, b) => a - b)
    expect(prices).toEqual(sortedPrices)

    await inventoryPage.sortBy('hilo')

    await expect(inventoryPage.prices.first()).toHaveText('$49.99')
    const prices2 = await inventoryPage.getPrices()
    const reverseSortedPrices = [...prices2].sort((a, b) => b - a)
    expect(prices2).toEqual(reverseSortedPrices)
})

test('inventory items name A to Z and Z to A', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za')
    await expect(inventoryPage.itemNames.first()).toHaveText('Test.allTheThings() T-Shirt (Red)')
    const names2 = await inventoryPage.getNames()
    const reverseSortedNames = [...names2].sort((a, b) => b.localeCompare(a))
    expect(names2).toEqual(reverseSortedNames)

    await inventoryPage.sortBy('az')
    await expect(inventoryPage.itemNames.first()).toHaveText('Sauce Labs Backpack')
    const names = await inventoryPage.getNames()
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sortedNames)
})