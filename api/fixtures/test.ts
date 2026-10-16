import { test as base } from '@playwright/test'
import { UsersClient } from '../clients/UsersClient'
import { AuthClient } from '../clients/AuthClient'

type ApiFixtures = {
    usersClient: UsersClient,
    authClient: AuthClient
}

// Built on the built-in `request` fixture, which already carries the api project's
// baseURL and x-api-key header — so the clients need no config of their own.
export const test = base.extend<ApiFixtures>({
    usersClient: async ({ request }, use) => {
        await use(new UsersClient(request))
    },
    authClient: async ({ request }, use) => {
        await use(new AuthClient(request))
    }
})

export { expect } from '@playwright/test'
