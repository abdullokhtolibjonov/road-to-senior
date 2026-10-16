import type { APIResponse } from '@playwright/test'
import { BaseClient } from './BaseClient'
import type { ApiResponse } from './ApiResponse'
import {
    CreatedUserSchema,
    SingleUserSchema,
    UpdatedUserSchema,
    UserListSchema,
    type CreatedUser,
    type SingleUser,
    type UpdatedUser,
    type UserList,
    type UserPayload
} from '../schemas/user.schema'

export class UsersClient extends BaseClient {
    listUsers(page = 1): Promise<ApiResponse<UserList>> {
        return this.get('/api/users', UserListSchema, { params: { page } })
    }

    getUser(id: number): Promise<ApiResponse<SingleUser>> {
        return this.get(`/api/users/${id}`, SingleUserSchema)
    }

    createUser(payload: UserPayload): Promise<ApiResponse<CreatedUser>> {
        return this.post('/api/users', CreatedUserSchema, { data: payload })
    }

    updateUser(id: number, payload: UserPayload): Promise<ApiResponse<UpdatedUser>> {
        return this.put(`/api/users/${id}`, UpdatedUserSchema, { data: payload })
    }

    patchUser(id: number, payload: Partial<UserPayload>): Promise<ApiResponse<UpdatedUser>> {
        return this.patch(`/api/users/${id}`, UpdatedUserSchema, { data: payload })
    }

    deleteUser(id: number): Promise<APIResponse> {
        return this.delete(`/api/users/${id}`)
    }
}
