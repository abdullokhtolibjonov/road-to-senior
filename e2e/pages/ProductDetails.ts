import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage';

export class ProductDetails extends BasePage {
    protected readonly path = '/inventory-item.html?id=';
    readonly backToProductsButton: Locator
    protected readonly addToCartButton: Locator

    constructor(page: Page) {
        super(page)
        this.backToProductsButton = page.getByTestId('back-to-products')
        this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    }

    async getProductUrl(id: number): Promise<string> {
        return `${this.path}${id}`;
    }
}