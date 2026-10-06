import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { credentialsFor, type Role } from '../test-data/users';

export class LoginPage extends BasePage {
    protected readonly path = '/';
    readonly usernameInput: Locator = this.page.getByTestId('username');
    readonly passwordInput: Locator = this.page.getByTestId('password');
    readonly loginButton: Locator = this.page.getByTestId('login-button');
    readonly errorMessage: Locator = this.page.getByTestId('error');

    constructor(page: Page) {
        super(page)
    }

    async loginAs(role: Role): Promise<void> {
        const { username, password } = credentialsFor(role)
        await this.usernameInput.fill(username)
        await this.passwordInput.fill(password)
        await this.loginButton.click()
    }
}