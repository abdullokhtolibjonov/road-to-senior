import { test, expect } from '../fixtures/test'
import { ErrorBodySchema } from '../schemas/common.schema'
import { API_ERRORS, EMILY, NEW_USER } from '../test-data/users'

// Server timestamps vs our clock: allow a few minutes of skew.
const CLOCK_SKEW_MS = 5 * 60_000
function msFromNow(isoDate: string): number {
    return Math.abs(Date.now() - Date.parse(isoDate))
}

type InvalidIdCase = {
    title: string
    id: number | string
    status: number
    message: string
}

const invalidIdCases: InvalidIdCase[] = [
    { title: 'unknown id', id: 9999, status: 404, message: API_ERRORS.user_not_found(9999) },
    { title: 'non-numeric id', id: 'abc', status: 400, message: API_ERRORS.invalid_user_id('abc') }
]

test.describe('Users API', { tag: ['@users'] }, () => {
    test('GET /users returns the requested page', async ({ usersClient }) => {
        const response = await usersClient.listUsers(5, 10)
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body.limit).toBe(5)
        expect(body.skip).toBe(10)
        expect(body.users).toHaveLength(5)
        const ids = body.users.map(user => user.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    test('GET /users past the last user returns an empty page', async ({ usersClient }) => {
        // Ask the API how many users exist instead of hard-coding today's number.
        const { total } = await (await usersClient.listUsers(1)).body()

        const response = await usersClient.listUsers(5, total)
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body.users).toEqual([])
        expect(body.total).toBe(total)
    })

    test('GET /users/search returns only matching users', async ({ usersClient }) => {
        const response = await usersClient.searchUsers('john')
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body.users.length).toBeGreaterThan(0)
        expect(body.total).toBe(body.users.length)
        for (const user of body.users) {
            expect(`${user.firstName} ${user.lastName}`.toLowerCase()).toContain('john')
        }
    })

    test('GET /users/search with no match returns an empty list', async ({ usersClient }) => {
        const response = await usersClient.searchUsers('zzzz')
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body.users).toEqual([])
        expect(body.total).toBe(0)
    })

    test('GET /users/:id returns that user', async ({ usersClient }) => {
        const response = await usersClient.getUser(EMILY.id)
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body.id).toBe(EMILY.id)
        expect(body.username).toBe(EMILY.username)
    })

    for (const c of invalidIdCases) {
        test(`GET /users/:id with ${c.title} returns ${c.status}`, async ({ usersClient }) => {
            const response = await usersClient.getUser(c.id)
            expect(response.status).toBe(c.status)

            const body = await response.bodyAs(ErrorBodySchema)
            expect(body.message).toBe(c.message)
        })
    }

    test('POST /users/add echoes the new user with an id', async ({ usersClient }) => {
        const response = await usersClient.createUser(NEW_USER)
        expect(response.status).toBe(201)

        // The schema already guarantees a positive integer id; here we check our data came back.
        const body = await response.body()
        expect(body).toMatchObject(NEW_USER)
    })

    test('PUT /users/:id returns the updated user', async ({ usersClient }) => {
        const response = await usersClient.updateUser(EMILY.id, NEW_USER)
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body).toMatchObject({ id: EMILY.id, ...NEW_USER })
    })

    test('PATCH /users/:id changes only the sent field', async ({ usersClient }) => {
        const response = await usersClient.patchUser(EMILY.id, { lastName: 'Patched' })
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body.lastName).toBe('Patched')
        expect(body.username).toBe(EMILY.username)
    })

    test('DELETE /users/:id marks the user deleted', async ({ usersClient }) => {
        const response = await usersClient.deleteUser(EMILY.id)
        expect(response.status).toBe(200)

        // isDeleted === true is enforced by the schema (z.literal(true)).
        const body = await response.body()
        expect(body.id).toBe(EMILY.id)
        expect(msFromNow(body.deletedOn)).toBeLessThan(CLOCK_SKEW_MS)
    })

    test('a slow response fails with a client-side timeout', async ({ usersClient }) => {
        // Server waits 3s, we only wait 1s → the call must reject, not hang.
        await expect(usersClient.listUsersDelayed(3_000, 1_000)).rejects.toThrow(/Timeout 1000ms exceeded/)
    })
})
