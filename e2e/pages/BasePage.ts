import type { Page } from '@playwright/test'

export abstract class BasePage {
    protected readonly page: Page;
    protected abstract readonly path: string;

    constructor(page: Page) {
        this.page = page;
    }

    async goto(): Promise<void> {
        await this.page.goto(this.path);
    }

    async expectLoaded(): Promise<void> {
        await this.page.waitForURL(this.path);
    }
}