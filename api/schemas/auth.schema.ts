import { z } from 'zod'

// Body for POST /api/register and /api/login. password is optional so we can send the
// "Missing password" case. With exactOptionalPropertyTypes, leave the key out — don't pass undefined.
export const CredentialsSchema = z.object({
    email: z.string(),
    password: z.string().optional()
})
export type Credentials = z.infer<typeof CredentialsSchema>

// POST /api/register → 200
export const RegisterSuccessSchema = z.object({
    id: z.number().int().positive(),
    token: z.string().min(1)
})
export type RegisterSuccess = z.infer<typeof RegisterSuccessSchema>

// POST /api/login → 200
export const LoginSuccessSchema = z.object({
    token: z.string().min(1)
})
export type LoginSuccess = z.infer<typeof LoginSuccessSchema>
