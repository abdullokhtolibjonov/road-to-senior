import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { HeaderComponent } from './components/HeaderComponent'
import { parsePrice } from '../utils/money'

export class CheckoutOverviewPage extends BasePage {
    protected readonly path = '/checkout-step-two.html'
    readonly headerComponent: HeaderComponent
    readonly finishButton: Locator
    readonly cancelButton: Locator
    readonly itemNames: Locator
    readonly prices: Locator
    readonly priceToalLabel: Locator

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
        this.finishButton = page.getByTestId('finish')
        this.cancelButton = page.getByTestId('cancel')
        this.itemNames = page.getByTestId('inventory-item-name')
        this.prices = page.getByTestId('inventory-item-price')
        this.priceToalLabel = page.getByTestId('subtotal-label')
    }

    async getNames(): Promise<string[]> {
        return await this.itemNames.allTextContents()
    }

    async getPrices(): Promise<number[]> {
        const textPrices = await this.prices.allTextContents()

        const numberPrices = textPrices.map(parsePrice);

        return numberPrices
    }

    async getSummary() {
        const prices: number[] = await this.getPrices()

        const total = prices.reduce((acc, p) => acc + p, 0)

        return total
    }

    async getSummaryLabel() {
        const label = await this.priceToalLabel.textContent()

        if (label === null) {
            throw new Error('Summary label has no text content');
        }

        const match = label.match(/\d+(\.\d+)?/)

        if (!match) {
            throw new Error(`No number found in label: "${label}"`);
        }

        return parseFloat(match[0]);
    }

    async finish() {
        await this.finishButton.click()
    }
}