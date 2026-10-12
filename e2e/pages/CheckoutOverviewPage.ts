import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { HeaderComponent } from './components/HeaderComponent'
import { parsePrice } from '../utils/money'
import type { CheckoutSummary } from '../utils/types/types'

export class CheckoutOverviewPage extends BasePage {
    protected readonly path = '/checkout-step-two.html'
    readonly headerComponent: HeaderComponent
    readonly finishButton: Locator
    readonly cancelButton: Locator
    readonly itemNames: Locator
    readonly itemPrices: Locator
    readonly subtotalLabel: Locator
    readonly taxLabel: Locator
    readonly totalLabel: Locator

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
        this.finishButton = page.getByTestId('finish')
        this.cancelButton = page.getByTestId('cancel')
        this.itemNames = page.getByTestId('inventory-item-name')
        this.itemPrices = page.getByTestId('inventory-item-price')
        this.subtotalLabel = page.getByTestId('subtotal-label')
        this.taxLabel = page.getByTestId('tax-label')
        this.totalLabel = page.getByTestId('total-label')
    }

    async getNames(): Promise<string[]> {
        return await this.itemNames.allTextContents()
    }

    async getPrices(): Promise<number[]> {
        const textPrices = await this.itemPrices.allTextContents()

        const numberPrices = textPrices.map(parsePrice);

        return numberPrices
    }

    async getSummary(): Promise<CheckoutSummary> {
        return {
            subtotal: parsePrice(await this.subtotalLabel.textContent()),
            tax: parsePrice(await this.taxLabel.textContent()),
            total: parsePrice(await this.totalLabel.textContent())
        }
    }

    async finish() {
        await this.finishButton.click()
    }
}