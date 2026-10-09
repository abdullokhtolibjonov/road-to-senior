import type { Page } from '@playwright/test'
import type { SortOption } from '../utils/types/types';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components/HeaderComponent';

export class InventoryPage extends BasePage {
    readonly headerComponent: HeaderComponent
    protected readonly path = '/inventory.html'

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
    }

    async addToCart(name: string): Promise<void> {
        await this.page
            .locator('[data-test="inventory-item"]')
            .filter({ hasText: name })
            .getByRole('button', { name: 'Add to cart' })
            .click()
    }

    async removeFromCart(name: string): Promise<void> {
        await this.page
            .locator('[data-test="inventory-item"]')
            .filter({ hasText: name })
            .getByRole('button', { name: 'Remove' })
            .click()
    }

    async getNames(): Promise<string[]> {
        return await this.page
            .locator('[data-test="inventory-item-name"]').allTextContents()
    }

    async getPrices(): Promise<string[]> {
        return await this.page
            .locator('[data-test="inventory-item-price"]').allTextContents()
    }

    async sortBy(option: SortOption): Promise<void> {
        await this.page.locator('[data-test="product-sort-container"]').selectOption(option)
    }
}