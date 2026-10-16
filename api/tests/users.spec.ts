import { test, expect } from '@playwright/test'

// Raw `request` fixture on purpose: this proves the `api` project (baseURL + API key header) works.
// Step 4.3 replaces these raw calls with a typed UsersClient.
test('GET /api/users/2 returns user 2', async ({ request }) => {
    const response = await request.get('/api/users/2')

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.data.id).toBe(2)
})
