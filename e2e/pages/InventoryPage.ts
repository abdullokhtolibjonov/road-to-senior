import type { Page } from '@playwright/test'
import type { SortOption } from '../utils/types/types';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { parsePrice } from '../utils/money';

export class InventoryPage extends BasePage {
    readonly headerComponent: HeaderComponent
    protected readonly path = '/inventory.html'

    private get inventoryItems() {
        return this.page.getByTestId('inventory-item')
    }

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
    }

    async addToCart(name: string): Promise<void> {
        await this.inventoryItems
            .filter({ hasText: name })
            .getByRole('button', { name: 'Add to cart' })
            .click()
    }

    async remove(name: string): Promise<void> {
        await this.inventoryItems
            .filter({ hasText: name })
            .getByRole('button', { name: 'Remove' })
            .click()
    }

    async getNames(): Promise<string[]> {
        return await this.page.getByTestId('inventory-item-name').allTextContents()
    }

    async getPrices(): Promise<number[]> {
        const textPrices = await this.page.getByTestId('inventory-item-price').allTextContents()

        const numberPrices = textPrices.map(p => parsePrice(p));

        return numberPrices
    }

    async sortBy(option: SortOption): Promise<void> {
        await this.page.getByTestId('product-sort-container').selectOption(option)
    }
}