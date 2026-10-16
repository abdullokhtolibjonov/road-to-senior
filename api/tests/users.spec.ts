import { test, expect } from '@playwright/test'
import { UsersClient } from '../clients/UsersClient'

// Temporary: the client is built by hand here; step 4.4 moves this into a `usersClient` fixture.
test('GET /api/users/2 returns user 2', async ({ request }) => {
    const usersClient = new UsersClient(request)

    const response = await usersClient.getUser(2)
    expect(response.status).toBe(200)

    const body = await response.body()
    expect(body.data.id).toBe(2)
})
