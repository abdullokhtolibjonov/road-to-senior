import { test, expect } from '../fixtures/test'
import type { CheckoutInfo } from '../utils/types/types';
import { MESSAGES } from '../test-data/messages'
import { PRODUCTS, TAX_RATE } from '../test-data/products'
import { sumCents, toCents } from '../utils/money'

test.beforeEach(async ({ loggedIn }) => {})

type CheckoutErrorCase = {
    title: string
    info: Partial<CheckoutInfo>
    error: string
}

const errorCases: CheckoutErrorCase[] = [
    {
        title: 'missing first name',
        info: { lastName: 'Tolibjonov', postalCode: '011700' },
        error: MESSAGES.first_name_required
    },
    {
        title: 'missing last name',
        info: { firstName: 'Abdulloh', postalCode: '011700' },
        error: MESSAGES.last_name_required
    },
    {
        title: 'missing postal code',
        info: { firstName: 'Abdulloh', lastName: 'Tolibjonov' },
        error: MESSAGES.postal_code_required
    }
]

test.describe('Checkout step one errors', { tag: ['@checkout'] }, () => {
    for (const c of errorCases) {
        test(`shows an error for ${c.title}`, async ({ checkoutPage }) => {
            // Form validation doesn't depend on the cart, so open step one directly.
            await checkoutPage.goto()
            await checkoutPage.fillInfo(c.info)
            await checkoutPage.continue()

            await expect(checkoutPage.errorMessage).toHaveText(c.error)
            await checkoutPage.expectLoaded()
        })
    }
})

test('user can complete checkout with correct totals', { tag: ['@smoke']}, async({ inventoryPage, cartPage, checkoutPage, checkoutOverviewPage, checkoutCompletePage }) => {
    const backpackName = 'Sauce Labs Backpack'
    const tshirtName = 'Sauce Labs Bolt T-Shirt'
    const data: CheckoutInfo = {
        firstName: 'Abdulloh',
        lastName: 'Tolibjonov',
        postalCode: '011700'
    }
    const expectedSubtotalCents = toCents(PRODUCTS[backpackName]) + toCents(PRODUCTS[tshirtName])

    await inventoryPage.addToCart(backpackName)
    await inventoryPage.addToCart(tshirtName)

    await expect(inventoryPage.headerComponent.cartBadge).toHaveText('2')

    await inventoryPage.headerComponent.cartButton.click()
    await cartPage.checkout()

    await checkoutPage.fillInfo(data)
    await checkoutPage.continue()

    const summary = await checkoutOverviewPage.getSummary()
    const subtotalCents = toCents(summary.subtotal)
    const taxCents = toCents(summary.tax)
    const itemCents = (await checkoutOverviewPage.getPrices()).map(toCents)

    // Money is compared in whole cents: integers have no float rounding errors.
    expect(subtotalCents).toBe(sumCents(itemCents))
    expect(subtotalCents).toBe(expectedSubtotalCents)
    expect(taxCents).toBe(Math.round(subtotalCents * TAX_RATE))
    expect(toCents(summary.total)).toBe(subtotalCents + taxCents)
    expect(await checkoutOverviewPage.getNames()).toEqual([backpackName, tshirtName])

    await checkoutOverviewPage.finish()

    await expect(checkoutCompletePage.successMessage).toHaveText(MESSAGES.success_message)
    
    await checkoutCompletePage.backHome()
    await inventoryPage.expectLoaded()
    await expect(inventoryPage.headerComponent.cartBadge).toBeHidden()
})