import type { APIResponse } from '@playwright/test'
import { z } from 'zod'

// Wraps Playwright's APIResponse and remembers which schema describes the *success* body.
// Status and body are separate on purpose: tests assert the status first, so a 500 fails with
// "expected 200, received 500" instead of a confusing schema error.
export class ApiResponse<T> {
    readonly raw: APIResponse
    private readonly schema: z.ZodType<T>

    constructor(raw: APIResponse, schema: z.ZodType<T>) {
        this.raw = raw
        this.schema = schema
    }

    get status(): number {
        return this.raw.status()
    }

    // Success body, validated and typed.
    async body(): Promise<T> {
        return this.parseWith(this.schema)
    }

    // Any other body shape, e.g. ErrorBodySchema on a 400 or EmptyObjectSchema on a 404.
    async bodyAs<U>(schema: z.ZodType<U>): Promise<U> {
        return this.parseWith(schema)
    }

    private async parseWith<U>(schema: z.ZodType<U>): Promise<U> {
        const json: unknown = await this.raw.json()
        const result = schema.safeParse(json)

        if (!result.success) {
            throw new Error(
                `Schema validation failed for ${this.raw.url()} (status ${this.status}):\n` +
                `${z.prettifyError(result.error)}\n` +
                `Body: ${JSON.stringify(json, null, 2)}`
            )
        }

        return result.data
    }
}
