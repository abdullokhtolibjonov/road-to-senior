import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage';
import { HeaderComponent } from './componenets/HeaderComponent';

export class InventoryPage extends BasePage {
    readonly headerComponent: HeaderComponent
    protected readonly path = '/inventory.html'
    protected readonly addToCartButton: Locator

    constructor(page: Page) {
        super(page)
        this.headerComponent = new HeaderComponent(page)
        this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    }
}