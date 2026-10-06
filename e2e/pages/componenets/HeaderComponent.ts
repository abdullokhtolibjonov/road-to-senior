import type { Page, Locator } from '@playwright/test'

export class HeaderComponent {
    readonly cartButton: Locator
    readonly burgerMenuButton: Locator
    readonly logoutButton: Locator
    constructor(readonly page: Page) {
        this.cartButton = page.getByTestId('shopping-cart-link')
        this.burgerMenuButton = page.getByRole('button', { name: 'Open Menu' })
        this.logoutButton = page.getByTestId('logout-sidebar-link')
    }

    async logout(): Promise<void> {
        await this.burgerMenuButton.click()
        await this.logoutButton.click()
    }

    async openCart(): Promise<void> {
        await this.cartButton.click()
    }
}