import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { HeaderComponent } from './components/HeaderComponent'
import type { CheckoutInfo } from '../utils/types/types';

export class CheckoutPage extends BasePage {
    protected readonly path = '/checkout-step-one.html';
    readonly headerComponent: HeaderComponent
    readonly continueButton: Locator
    readonly cancelButton: Locator
    readonly firstNameInput: Locator
    readonly lastNameInput: Locator
    readonly postalCodeInput: Locator
    readonly errorMessage: Locator

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
        this.continueButton = page.getByTestId('continue')
        this.cancelButton = page.getByTestId('cancel')
        this.firstNameInput = page.getByTestId('firstName')
        this.lastNameInput = page.getByTestId('lastName')
        this.postalCodeInput = page.getByTestId('postalCode')
        this.errorMessage = page.getByTestId('error')
    }

    async fillInfo(info: Partial<CheckoutInfo>) {
        if (info.firstName !== undefined) {
            await this.firstNameInput.fill(info.firstName)
        }
        if (info.lastName !== undefined) {
            await this.lastNameInput.fill(info.lastName)
        }
        if (info.postalCode !== undefined) {
            await this.postalCodeInput.fill(info.postalCode)
        }
    }

    async continue() {
        await this.continueButton.click()
    }
}