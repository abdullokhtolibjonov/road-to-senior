import { z } from 'zod'

// reqres adds this block to most responses; its text is marketing and changes, so only the shape is checked.
export const SupportSchema = z.object({
    url: z.url(),
    text: z.string()
})

// Every 4xx body from reqres: { "error": "Missing password" }
export const ErrorBodySchema = z.object({
    error: z.string().min(1)
})
export type ErrorBody = z.infer<typeof ErrorBodySchema>

// GET /api/users/23 → 404 with exactly {} — strictObject rejects any extra key.
export const EmptyObjectSchema = z.strictObject({})
