import type { Page } from '@playwright/test'
import { step } from '../utils/step';

export abstract class BasePage {
    protected readonly page: Page;
    protected abstract readonly path: string;

    constructor(page: Page) {
        this.page = page;
    }

    // `this.constructor.name` is the subclass name, e.g. "Open InventoryPage"
    async goto(): Promise<void> {
        await step(`Open ${this.constructor.name}`, async () => {
            await this.page.goto(this.path);
        })
    }

    async expectLoaded(): Promise<void> {
        await step(`Expect ${this.constructor.name} loaded`, async () => {
            await this.page.waitForURL(this.path);
        })
    }
}
