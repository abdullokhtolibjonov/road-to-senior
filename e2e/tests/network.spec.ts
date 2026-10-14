import { expect, test } from '../fixtures/test'

test.describe('network interception tests', { tag: '@network' }, () => {
    test('inventory still works when images fail to load', async ({ page, inventoryPage }) => {
        let blocked = 0
        await page.route(/\.(png|jpe?g|svg)$/ , async (route) => {
            blocked++
            await route.abort()
        })

        await inventoryPage.goto()
        await inventoryPage.expectLoaded()

        await expect(inventoryPage.itemNames).toHaveCount(6)
        await inventoryPage.addToCart('Sauce Labs Backpack')
        await expect(inventoryPage.headerComponent.cartBadge).toHaveText('1')

        expect(blocked).toBeGreaterThan(0)
    })

    test('inventory still works when images load after 1500ms', async ({ page, inventoryPage }) => {
        let delayed = 0

        await page.route(/\.(png|jpe?g|svg)$/ , async (route) => {
            delayed++

            await new Promise((resolve) => setTimeout(resolve, 1500))

            await route.continue()
        })

        await inventoryPage.goto()
        await inventoryPage.expectLoaded()

        await expect(inventoryPage.itemNames).toHaveCount(6)
        await inventoryPage.addToCart('Sauce Labs Backpack')
        await expect(inventoryPage.headerComponent.cartBadge).toHaveText('1')
        expect(delayed).toBeGreaterThan(0)
    })

    test('shows server error when inventory page returns 500', async ({ page, inventoryPage }) => {
        await page.route('**/inventory.html' , async (route) => {

            await route.fulfill({ status: 500, body: 'Server error' })
        })

        const response = await page.goto('/inventory.html')
        expect(response?.status()).toBe(500)

        await expect(page.getByText('Server error')).toBeVisible()
        await expect(inventoryPage.itemNames).toHaveCount(0)
    })
})