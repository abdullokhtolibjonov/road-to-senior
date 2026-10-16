import { expect, test } from '../fixtures/test'
import { PRODUCTS } from '../test-data/products'

test.beforeEach(async ({ loggedIn }) => {})

test('add 2 items to cart and remove 1 of them from cart', { tag: ['@cart', '@smoke'] }, async ({ cartPage, inventoryPage }) => {
    const backpackName = 'Sauce Labs Backpack'
    const bikeLightName = 'Sauce Labs Bike Light'

    await inventoryPage.addToCart(backpackName)
    await inventoryPage.addToCart(bikeLightName)
    await expect(inventoryPage.headerComponent.cartBadge).toHaveText('2')

    await inventoryPage.headerComponent.cartButton.click()
    await cartPage.expectLoaded()

    await expect(cartPage.itemNames).toHaveText([backpackName, bikeLightName])
    expect(await cartPage.getPrices()).toEqual([PRODUCTS[backpackName], PRODUCTS[bikeLightName]])

    await cartPage.remove(bikeLightName)
    await expect(cartPage.itemNames).toHaveText([backpackName])
    await expect(cartPage.headerComponent.cartBadge).toHaveText('1')
    expect(await cartPage.getPrices()).toEqual([PRODUCTS[backpackName]])
})