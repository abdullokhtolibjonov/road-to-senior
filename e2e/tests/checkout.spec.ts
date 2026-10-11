import { test, expect } from '../fixtures/test'
import { InventoryPage } from '../pages/InventoryPage';
import type { CheckoutInfo } from '../utils/types/types';
import { MESSAGES } from '../test-data/messages'
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';

test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await inventoryPage.expectLoaded()
})

test('checkout first step form displays error messages', async ({ inventoryPage, cartPage, checkoutPage, checkoutOverviewPage, checkoutCompletePage }) => {
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

    await checkoutPage.postalCodeInput.fill('011700')
    await checkoutPage.continue()

    const calculatedSummaryPrice = await checkoutOverviewPage.getSummary()
    const summaryLabel = await checkoutOverviewPage.getSummaryLabel()
    
    expect(calculatedSummaryPrice).toEqual(summaryLabel)

    await checkoutOverviewPage.finish()

    await expect(checkoutCompletePage.successMessage).toBeVisible()
})