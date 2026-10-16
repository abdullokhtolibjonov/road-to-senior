import { z } from 'zod'
import { SupportSchema } from './common.schema'

// ---- reads ----

export const UserSchema = z.object({
    id: z.number().int().positive(),
    email: z.email(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    avatar: z.url()
})
export type User = z.infer<typeof UserSchema>

// GET /api/users?page=N
export const UserListSchema = z.object({
    page: z.number().int().positive(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
    data: z.array(UserSchema),
    support: SupportSchema
})
export type UserList = z.infer<typeof UserListSchema>

// GET /api/users/:id
export const SingleUserSchema = z.object({
    data: UserSchema,
    support: SupportSchema
})
export type SingleUser = z.infer<typeof SingleUserSchema>

// ---- writes ----

// What we send in POST / PUT / PATCH
export const UserPayloadSchema = z.object({
    name: z.string(),
    job: z.string()
})
export type UserPayload = z.infer<typeof UserPayloadSchema>

// POST /api/users → 201. Note: id is a STRING here, but a number on GET.
export const CreatedUserSchema = UserPayloadSchema.extend({
    id: z.string().min(1),
    createdAt: z.iso.datetime()
})
export type CreatedUser = z.infer<typeof CreatedUserSchema>

// PUT / PATCH /api/users/:id → 200. PATCH echoes only the fields sent, so both are optional.
export const UpdatedUserSchema = UserPayloadSchema.partial().extend({
    updatedAt: z.iso.datetime()
})
export type UpdatedUser = z.infer<typeof UpdatedUserSchema>
