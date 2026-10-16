import { z } from 'zod'

// Body for POST /auth/login. password is optional so we can send the "required" error case.
// With exactOptionalPropertyTypes, leave the key out — don't pass undefined.
export const CredentialsSchema = z.object({
    username: z.string(),
    password: z.string().optional()
})
export type Credentials = z.infer<typeof CredentialsSchema>

// A JWT is three base64url parts joined by dots: header.payload.signature
const JwtSchema = z.string().regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'expected a JWT (header.payload.signature)')

// POST /auth/login → 200
export const LoginSuccessSchema = z.object({
    id: z.number().int().positive(),
    username: z.string().min(1),
    email: z.email(),
    accessToken: JwtSchema,
    refreshToken: JwtSchema
})
export type LoginSuccess = z.infer<typeof LoginSuccessSchema>
