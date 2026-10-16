import { test as base, expect } from '@playwright/test'
import { UsersClient } from '../clients/UsersClient'
import { AuthClient } from '../clients/AuthClient'
import { EMILY_CREDENTIALS } from '../test-data/users'

type ApiFixtures = {
    usersClient: UsersClient,
    authClient: AuthClient
}

type ApiWorkerFixtures = {
    accessToken: string
}

// Test fixtures are built on the built-in `request` fixture, which already carries the api
// project's baseURL — so the clients need no config of their own.
export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
    usersClient: async ({ request }, use) => {
        await use(new UsersClient(request))
    },
    authClient: async ({ request }, use) => {
        await use(new AuthClient(request))
    },

    // Logs in once per worker process and shares the token with every test that worker runs —
    // the API version of storageState. Worker fixtures can't use the test-scoped `request`,
    // so this one makes (and disposes) its own request context.
    accessToken: [async ({ playwright }, use, workerInfo) => {
        const baseURL = workerInfo.project.use.baseURL
        if (!baseURL) {
            throw new Error(`Project "${workerInfo.project.name}" has no baseURL`)
        }

        const request = await playwright.request.newContext({ baseURL })
        const response = await new AuthClient(request).login(EMILY_CREDENTIALS)
        expect(response.status, 'login for the shared accessToken').toBe(200)
        const { accessToken } = await response.body()

        await use(accessToken)

        await request.dispose()
    }, { scope: 'worker' }]
})

export { expect }
