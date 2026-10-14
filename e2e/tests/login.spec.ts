import { test, expect } from '../fixtures/test'
import { MESSAGES } from '../test-data/messages';
import { PASSWORD, USER_ROLES } from '../test-data/users';

test.use({ storageState: { cookies: [], origins: [] }})

type LoginErrorCase = {
    title: string
    username: string
    password: string
    error: string
}

const errorCases: LoginErrorCase[] = [
    {
        title: 'locked out user',
        username: USER_ROLES.lockedUser,
        password: PASSWORD,
        error: MESSAGES.locked_user
    },
    {
        title: 'wrong password',
        username: USER_ROLES.standardUser,
        password: 'wrong',
        error: MESSAGES.username_or_password_mismatch
    },
    {
        title: 'username required',
        username: '',
        password: PASSWORD,
        error: MESSAGES.username_required
    },
    {
        title: 'password required',
        username: USER_ROLES.standardUser,
        password: '',
        error: MESSAGES.password_required
    }
]

test.describe('Login errors', { tag: ['@login']}, () => {
    for (const c of errorCases) {
        test(`shows an error for ${c.title}`, async ({ loginPage }) => {
            await loginPage.goto()
            await loginPage.login(c.username, c.password)

            await expect(loginPage.errorMessage).toHaveText(c.error)
            await loginPage.expectLoaded()
        })
    }
})

test('standard user logs in and lands on inventory', {tag: ['@login', '@smoke']}, async ({ loginPage, inventoryPage }) => {
    await loginPage.goto()
    await loginPage.loginAs('standardUser')
    await inventoryPage.expectLoaded()
})