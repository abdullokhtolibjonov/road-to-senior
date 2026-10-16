import { z } from 'zod'

// ---- reads ----

// A dummyjson user has ~30 fields; we check the ones tests rely on. z.object ignores (and strips) the rest.
export const UserSchema = z.object({
    id: z.number().int().positive(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    age: z.number().int().positive(),
    gender: z.string(),
    email: z.email(),
    username: z.string().min(1),
    image: z.url(),
    role: z.enum(['admin', 'moderator', 'user']),
    address: z.object({
        city: z.string(),
        country: z.string()
    })
})
export type User = z.infer<typeof UserSchema>

// GET /users?limit=N&skip=M
export const UserListSchema = z.object({
    users: z.array(UserSchema),
    total: z.number().int().nonnegative(),
    skip: z.number().int().nonnegative(),
    limit: z.number().int().nonnegative()
})
export type UserList = z.infer<typeof UserListSchema>

// ---- writes (dummyjson simulates them: nothing is stored) ----

// What we send to POST /users/add, PUT and PATCH /users/:id
export const UserPayloadSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    age: z.number().int()
})
export type UserPayload = z.infer<typeof UserPayloadSchema>

// POST /users/add → 201. Fields we didn't send come back as '' (e.g. email: ''), so this can't
// reuse UserSchema — its z.email() would reject ''. Only our fields + the new id are checked.
export const CreatedUserSchema = UserPayloadSchema.extend({
    id: z.number().int().positive()
})
export type CreatedUser = z.infer<typeof CreatedUserSchema>

// DELETE /users/:id → 200 with the full user plus deletion info
export const DeletedUserSchema = UserSchema.extend({
    isDeleted: z.literal(true),
    deletedOn: z.iso.datetime()
})
export type DeletedUser = z.infer<typeof DeletedUserSchema>
