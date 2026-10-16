import { z } from 'zod'

// Every 4xx/5xx body from dummyjson: { "message": "Invalid credentials" }
export const ErrorBodySchema = z.object({
    message: z.string().min(1)
})
export type ErrorBody = z.infer<typeof ErrorBodySchema>
