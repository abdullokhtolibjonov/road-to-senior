import type { Page } from '@playwright/test'
import { BasePage } from './BasePage.ts';

export class LoginPage extends BasePage {
    constructor(page: Page) {
        super(page)
    }
}