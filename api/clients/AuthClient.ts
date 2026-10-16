import { BaseClient } from './BaseClient'
import type { ApiResponse } from './ApiResponse'
import { LoginSuccessSchema, type Credentials, type LoginSuccess } from '../schemas/auth.schema'
import { UserSchema, type User } from '../schemas/user.schema'

export class AuthClient extends BaseClient {
    login(credentials: Credentials): Promise<ApiResponse<LoginSuccess>> {
        return this.post('/auth/login', LoginSuccessSchema, { data: credentials })
    }

    // The current user for a token. Called without a token to test the 401.
    me(accessToken?: string): Promise<ApiResponse<User>> {
        const headers = accessToken === undefined ? {} : { Authorization: `Bearer ${accessToken}` }
        return this.get('/auth/me', UserSchema, { headers })
    }
}
