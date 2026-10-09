import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage';
import { expect } from '@playwright/test';

export class ProductDetailsPage extends BasePage {
    protected readonly path = '/inventory-item.html';
    readonly backToProductsButton: Locator
    protected readonly addToCartButton: Locator
    readonly name: Locator
    readonly price: Locator

    constructor(page: Page) {
        super(page)
        this.backToProductsButton = page.getByTestId('back-to-products')
        this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
        this.name = page.getByTestId('inventory-item-name')
        this.price = page.getByTestId('inventory-item-price')
    }

    getProductUrl(id: number): string {
        return `${this.path}?id=${id}`;
    }

    override async expectLoaded(): Promise<void> {
        await expect(this.page).toHaveURL(/inventory-item\.html\?id=\d+/);
        await expect(this.backToProductsButton).toBeVisible();
    }

    async addToCart(): Promise<void> {
        await this.addToCartButton.click();
    }
}