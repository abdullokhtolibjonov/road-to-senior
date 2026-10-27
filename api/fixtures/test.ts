import { expect } from '@playwright/test'
import { test as base } from '../../shared/fixtures/faker'
import { UsersClient } from '../clients/UsersClient'
import { AuthClient } from '../clients/AuthClient'
import type { ApiCall } from '../clients/BaseClient'
import { EMILY_CREDENTIALS } from '../test-data/users'

type ApiFixtures = {
    apiLog: ApiCall[],
    usersClient: UsersClient,
    authClient: AuthClient
}

type ApiWorkerFixtures = {
    accessToken: string
}

// Test fixtures are built on the built-in `request` fixture, which already carries the api
// project's baseURL — so the clients need no config of their own.
export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
    // Every call the test's clients make lands here. The code after use() is teardown and runs
    // after the test body, when the result is known: only a failed test gets the log attached,
    // so the report shows the actual requests and responses without re-running anything.
    // eslint-disable-next-line no-empty-pattern
    apiLog: async ({}, use, testInfo) => {
        const log: ApiCall[] = []
        await use(log)
        if (testInfo.status !== testInfo.expectedStatus && log.length > 0) {
            await testInfo.attach('api calls', {
                body: JSON.stringify(log, null, 2),
                contentType: 'application/json'
            })
        }
    },
    usersClient: async ({ request, apiLog }, use) => {
        await use(new UsersClient(request, apiLog))
    },
    authClient: async ({ request, apiLog }, use) => {
        await use(new AuthClient(request, apiLog))
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
