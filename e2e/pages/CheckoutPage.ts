import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { HeaderComponent } from './components/HeaderComponent'

export class CheckoutPage extends BasePage {
    protected readonly path = '/checkout-step-one.html';
    readonly headerComponent: HeaderComponent
    readonly continueButton: Locator
    readonly cancelButton: Locator
    readonly firstNameInput: Locator
    readonly lastNameInput: Locator
    readonly postalCodeInput: Locator

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
        this.continueButton = page.getByTestId('continue')
        this.cancelButton = page.getByTestId('cancel')
        this.firstNameInput = page.getByTestId('firstName')
        this.lastNameInput = page.getByTestId('lastName')
        this.postalCodeInput = page.getByTestId('postalCode')
    }
}