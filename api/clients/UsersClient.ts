import { BaseClient } from './BaseClient'
import type { ApiResponse } from './ApiResponse'
import {
    CreatedUserSchema,
    DeletedUserSchema,
    UserListSchema,
    UserSchema,
    type CreatedUser,
    type DeletedUser,
    type User,
    type UserList,
    type UserPayload
} from '../schemas/user.schema'

export class UsersClient extends BaseClient {
    listUsers(limit: number, skip = 0): Promise<ApiResponse<UserList>> {
        return this.get('/users', UserListSchema, { params: { limit, skip } })
    }

    // dummyjson's ?delay=<ms> makes the server wait — used to test client-side timeouts.
    listUsersDelayed(delayMs: number, timeoutMs: number): Promise<ApiResponse<UserList>> {
        return this.get('/users', UserListSchema, { params: { limit: 1, delay: delayMs }, timeout: timeoutMs })
    }

    searchUsers(query: string): Promise<ApiResponse<UserList>> {
        return this.get('/users/search', UserListSchema, { params: { q: query } })
    }

    // `string` is allowed on purpose, to test invalid ids like 'abc'.
    getUser(id: number | string): Promise<ApiResponse<User>> {
        return this.get(`/users/${id}`, UserSchema)
    }

    createUser(payload: UserPayload): Promise<ApiResponse<CreatedUser>> {
        return this.post('/users/add', CreatedUserSchema, { data: payload })
    }

    updateUser(id: number, payload: UserPayload): Promise<ApiResponse<User>> {
        return this.put(`/users/${id}`, UserSchema, { data: payload })
    }

    patchUser(id: number, payload: Partial<UserPayload>): Promise<ApiResponse<User>> {
        return this.patch(`/users/${id}`, UserSchema, { data: payload })
    }

    deleteUser(id: number): Promise<ApiResponse<DeletedUser>> {
        return this.delete(`/users/${id}`, DeletedUserSchema)
    }
}
