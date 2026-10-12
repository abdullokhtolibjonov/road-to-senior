import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CheckoutCompletePage extends BasePage {
    protected readonly path = '/checkout-complete.html'
    readonly successMessage: Locator
    readonly generatePdfButton: Locator
    readonly backHomeButton: Locator

    constructor(page: Page) {
        super(page)

        this.successMessage = page.getByTestId('complete-header')
        this.generatePdfbutton = page.getByTestId('generate-pdf-order')
        this.backHomeButton = page.getByTestId('back-to-products')
    }

    async backHome(): Promise<void> {
        await this.backHomeButton.click();
    }
}