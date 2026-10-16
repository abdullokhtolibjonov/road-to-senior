import { test, expect } from '@playwright/test'
import { SingleUserSchema } from '../schemas/user.schema'

// Raw `request` fixture on purpose: this proves the `api` project (baseURL + API key header) works.
// Step 4.3 replaces these raw calls with a typed UsersClient.
test('GET /api/users/2 returns user 2', async ({ request }) => {
    const response = await request.get('/api/users/2')

    expect(response.status()).toBe(200)

    // parse() throws if the body doesn't match the schema; on success `body` is fully typed (not `any`).
    const body = SingleUserSchema.parse(await response.json())
    expect(body.data.id).toBe(2)
})
