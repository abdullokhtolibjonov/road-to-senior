import type { Page, Locator } from '@playwright/test'

export abstract class BasePage {
    protected page: Page;
    constructor(page: Page) {
        this.page = page;
    }

    async goto(url: string): Promise<void> {
        await this.page.goto(url);
    }
}