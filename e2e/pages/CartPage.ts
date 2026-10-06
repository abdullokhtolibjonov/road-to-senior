import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
    protected readonly path = '/cart.html';
    readonly checkoutButton: Locator
    readonly continueShoppingButton: Locator

    constructor(page: Page) {
        super(page)
        this.checkoutButton = page.getByTestId('checkout')
        this.continueShoppingButton = page.getByTestId('continue-shopping')
    }
}