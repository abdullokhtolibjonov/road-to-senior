import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CheckoutCompletePage extends BasePage {
    protected readonly path = '/checkout-complete.html'
    readonly successMessage: Locator
    readonly generatePdfButton: Locator
    readonly backHomeButton: Locator
    readonly ponyImage: Locator

    constructor(page: Page) {
        super(page)

        this.successMessage = page.getByTestId('complete-header')
        this.generatePdfButton = page.getByTestId('generate-pdf-order')
        this.backHomeButton = page.getByTestId('back-to-products')
        this.ponyImage = page.getByRole('img', { name: 'Pony Express' })
    }

    async backHome(): Promise<void> {
        // The image above the button loads late and pushes it ~70px down; clicking before that
        // hits the button's old position and nothing happens (flaky on Firefox). Wait for it first.
        await expect(this.ponyImage).toHaveJSProperty('complete', true);
        await this.backHomeButton.click();
    }
}