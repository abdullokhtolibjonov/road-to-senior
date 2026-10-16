import { test, expect } from '../fixtures/test'

test('GET /api/users/2 returns user 2', async ({ usersClient }) => {
    const response = await usersClient.getUser(2)
    expect(response.status).toBe(200)

    const body = await response.body()
    expect(body.data.id).toBe(2)
})
