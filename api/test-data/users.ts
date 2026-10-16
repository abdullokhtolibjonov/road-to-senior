import type { Credentials } from '../schemas/auth.schema'
import type { UserPayload } from '../schemas/user.schema'

// dummyjson's documented demo user (user id 1). Public test credentials, not a secret.
export const EMILY = {
    id: 1,
    username: 'emilys',
    password: 'emilyspass'
} as const

export const EMILY_CREDENTIALS: Credentials = {
    username: EMILY.username,
    password: EMILY.password
}

export const NEW_USER: UserPayload = {
    firstName: 'Abdulloh',
    lastName: 'Tolibjonov',
    age: 25
}

export const API_ERRORS = {
    invalid_credentials: 'Invalid credentials',
    credentials_required: 'Username and password required',
    access_token_required: 'Access Token is required',
    user_not_found: (id: number) => `User with id '${id}' not found`,
    invalid_user_id: (id: string) => `Invalid user id '${id}'`
} as const
