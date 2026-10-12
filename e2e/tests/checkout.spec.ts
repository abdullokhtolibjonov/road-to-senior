import { test, expect } from '../fixtures/test'
import type { CheckoutInfo } from '../utils/types/types';
import { MESSAGES } from '../test-data/messages'
import { PRODUCTS } from '../test-data/products'

test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await inventoryPage.expectLoaded()
})

test('checkout step one shows required-field errors', async ({ inventoryPage, cartPage, checkoutPage }) => {
    const backpackName = 'Sauce Labs Backpack'
    const tshirtName = 'Sauce Labs Bolt T-Shirt'
    const dataWithoutFirstName: Partial<CheckoutInfo> = {
        lastName: 'Tolibjonov',
        postalCode: '011700'
    }
    const dataWithoutLastName: Partial<CheckoutInfo> = {
        firstName: 'Abdulloh',
        postalCode: '011700'
    }
    const dataWithoutPostalCode: Partial<CheckoutInfo> = {
        firstName: 'Abdulloh',
        lastName: 'Tolibjonov'
    }
    
    await inventoryPage.addToCart(backpackName)
    await inventoryPage.addToCart(tshirtName)

    await expect(inventoryPage.headerComponent.cartBadge).toHaveText('2')

    await inventoryPage.headerComponent.cartButton.click()
    await cartPage.checkout()

    await checkoutPage.fillInfo(dataWithoutFirstName)
    await checkoutPage.continue()
    await expect(checkoutPage.errorMessage).toHaveText(MESSAGES.first_name_required)

    await checkoutPage.lastNameInput.clear()
    await checkoutPage.fillInfo(dataWithoutLastName)
    await checkoutPage.continue()
    await expect(checkoutPage.errorMessage).toHaveText(MESSAGES.last_name_required)

    await checkoutPage.postalCodeInput.clear()
    await checkoutPage.fillInfo(dataWithoutPostalCode)
    await checkoutPage.continue()
    await expect(checkoutPage.errorMessage).toHaveText(MESSAGES.postal_code_required)
})

test('user can complete checkout with correct totals', async({ inventoryPage, cartPage, checkoutPage, checkoutOverviewPage, checkoutCompletePage }) => {
    const backpackName = 'Sauce Labs Backpack'
    const tshirtName = 'Sauce Labs Bolt T-Shirt'
    const data: CheckoutInfo = {
        firstName: 'Abdulloh',
        lastName: 'Tolibjonov',
        postalCode: '011700'
    }
    const expectedSubtotal = PRODUCTS[backpackName] + PRODUCTS[tshirtName]
    
    await inventoryPage.addToCart(backpackName)
    await inventoryPage.addToCart(tshirtName)

    await expect(inventoryPage.headerComponent.cartBadge).toHaveText('2')

    await inventoryPage.headerComponent.cartButton.click()
    await cartPage.checkout()

    await checkoutPage.fillInfo(data)
    await checkoutPage.continue()

    const { subtotal, tax, total } = await checkoutOverviewPage.getSummary()
    
    expect(subtotal).toBeCloseTo(expectedSubtotal, 2)
    expect(total).toBeCloseTo(subtotal + tax, 2)
    expect(await checkoutOverviewPage.getNames()).toEqual([backpackName, tshirtName])

    await checkoutOverviewPage.finish()

    await expect(checkoutCompletePage.successMessage).toHaveText(MESSAGES.success_message)
    
    await checkoutCompletePage.backHome()
    await inventoryPage.expectLoaded()
    await expect(inventoryPage.headerComponent.cartBadge).toBeHidden()
})