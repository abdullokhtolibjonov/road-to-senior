import { test, expect } from '../fixtures/test'
import { MESSAGES } from '../test-data/messages';
import { PASSWORD, USER_ROLES, LOGIN_ROLES } from '../test-data/users';

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

test.describe('available users log in and land on inventory', () => {
    for (const role of LOGIN_ROLES) {
        test(`${role} can login and land on inventory page`, { tag: role === 'standardUser'? ['@smoke', '@login']: ['@login']}, async({ loginPage, inventoryPage }) => {
            await loginPage.goto()
            await loginPage.loginAs(role)
            await inventoryPage.expectLoaded()
        })
    }
})