import type { Page, Locator } from '@playwright/test'
import type { SortOption } from '../utils/types/types';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { parsePrice } from '../utils/money';

export class InventoryPage extends BasePage {
    readonly headerComponent: HeaderComponent
    protected readonly path = '/inventory.html'
    readonly prices: Locator
    readonly itemNames: Locator
    readonly images: Locator
    private get inventoryItems() {
        return this.page.getByTestId('inventory-item')
    }

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
        this.prices = page.getByTestId('inventory-item-price')
        this.itemNames = page.getByTestId('inventory-item-name')
        this.images = page.getByTestId('inventory-item').getByRole('img')
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
        return await this.itemNames.allTextContents()
    }

    async getPrices(): Promise<number[]> {
        const textPrices = await this.prices.allTextContents()

        const numberPrices = textPrices.map(parsePrice);

        return numberPrices
    }

    async sortBy(option: SortOption): Promise<void> {
        await this.page.getByTestId('product-sort-container').selectOption(option)
    }
}