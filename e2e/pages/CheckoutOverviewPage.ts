import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { HeaderComponent } from './componenets/HeaderComponent'

export class CheckoutOverviewPage extends BasePage {
    protected readonly path = '/checkout-step-two.html'
    readonly headerComponent: HeaderComponent
    readonly finishButton: Locator
    readonly cancelButton: Locator

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
        this.finishButton = page.getByTestId('finish')
        this.cancelButton = page.getByTestId('cancel')
    }
}