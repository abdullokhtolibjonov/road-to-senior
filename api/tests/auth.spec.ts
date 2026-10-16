import { test, expect } from '../fixtures/test'
import type { Credentials } from '../schemas/auth.schema'
import { ErrorBodySchema } from '../schemas/common.schema'
import { API_ERRORS, EMILY, EMILY_CREDENTIALS } from '../test-data/users'

type LoginErrorCase = {
    title: string
    credentials: Credentials
    message: string
}

const loginErrorCases: LoginErrorCase[] = [
    {
        title: 'wrong password',
        credentials: { username: EMILY.username, password: 'wrong' },
        message: API_ERRORS.invalid_credentials
    },
    {
        title: 'unknown user',
        credentials: { username: 'nobody', password: 'x' },
        message: API_ERRORS.invalid_credentials
    },
    {
        title: 'missing password',
        credentials: { username: EMILY.username },
        message: API_ERRORS.credentials_required
    },
    {
        title: 'empty username',
        credentials: { username: '', password: EMILY.password },
        message: API_ERRORS.credentials_required
    }
]

test.describe('Auth API', { tag: ['@auth'] }, () => {
    test('POST /auth/login returns tokens for a valid user', async ({ authClient }) => {
        const response = await authClient.login(EMILY_CREDENTIALS)
        expect(response.status).toBe(200)

        // Both tokens are validated as JWTs by LoginSuccessSchema.
        const body = await response.body()
        expect(body.id).toBe(EMILY.id)
        expect(body.username).toBe(EMILY.username)
    })

    for (const c of loginErrorCases) {
        test(`POST /auth/login rejects ${c.title}`, async ({ authClient }) => {
            const response = await authClient.login(c.credentials)
            expect(response.status).toBe(400)

            const body = await response.bodyAs(ErrorBodySchema)
            expect(body.message).toBe(c.message)
        })
    }

    test('GET /auth/me returns the user the token belongs to', async ({ authClient, accessToken }) => {
        const response = await authClient.me(accessToken)
        expect(response.status).toBe(200)

        const body = await response.body()
        expect(body.id).toBe(EMILY.id)
        expect(body.username).toBe(EMILY.username)
    })

    test('GET /auth/me without a token returns 401', async ({ authClient }) => {
        const response = await authClient.me()
        expect(response.status).toBe(401)

        const body = await response.bodyAs(ErrorBodySchema)
        expect(body.message).toBe(API_ERRORS.access_token_required)
    })

    test('GET /auth/me with an invalid token returns 401', async ({ authClient }) => {
        // Known API bug: dummyjson answers 500 {"message":"invalid token"} instead of 401.
        // Expected to fail — flips red once they fix it, so we notice and remove this line.
        test.fail()

        const response = await authClient.me('not.a.realtoken')
        expect(response.status).toBe(401)
    })
})
