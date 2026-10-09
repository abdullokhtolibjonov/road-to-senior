import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage';
import { parsePrice } from '../utils/money';
import { HeaderComponent } from './components/HeaderComponent';

export class CartPage extends BasePage {
    protected readonly path = '/cart.html';
    readonly checkoutButton: Locator
    readonly continueShoppingButton: Locator
    readonly headerComponent: HeaderComponent
    readonly itemNames: Locator

    private get inventoryItems() {
        return this.page.getByTestId('inventory-item')
    }

    constructor(page: Page) {
        super(page)
        this.checkoutButton = page.getByTestId('checkout')
        this.continueShoppingButton = page.getByTestId('continue-shopping')
        this.headerComponent = new HeaderComponent(page)
        this.itemNames = page.getByTestId('inventory-item-name')
    }

    override async expectLoaded(): Promise<void> {
        await this.page.waitForURL(this.path);
        await this.checkoutButton.waitFor({ state: 'visible' });
    }
    
    async getNames(): Promise<string[]> {
        return await this.itemNames.allTextContents()
    }

    async getPrices(): Promise<number[]> {
        const textPrices = await this.page.getByTestId('inventory-item-price').allTextContents()

        const numberPrices = textPrices.map(p => parsePrice(p));

        return numberPrices
    }

    async remove(name: string): Promise<void> {
        await this.inventoryItems
            .filter({ hasText: name })
            .getByRole('button', { name: 'Remove' })
            .click()
    }

    async checkout(): Promise<void> {
        await this.checkoutButton.click()
    }
}