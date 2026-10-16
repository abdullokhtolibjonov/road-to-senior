import { BaseClient } from './BaseClient'
import type { ApiResponse } from './ApiResponse'
import {
    LoginSuccessSchema,
    RegisterSuccessSchema,
    type Credentials,
    type LoginSuccess,
    type RegisterSuccess
} from '../schemas/auth.schema'

export class AuthClient extends BaseClient {
    register(credentials: Credentials): Promise<ApiResponse<RegisterSuccess>> {
        return this.post('/api/register', RegisterSuccessSchema, { data: credentials })
    }

    login(credentials: Credentials): Promise<ApiResponse<LoginSuccess>> {
        return this.post('/api/login', LoginSuccessSchema, { data: credentials })
    }
}
