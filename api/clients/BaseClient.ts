import type { APIRequestContext, APIResponse } from '@playwright/test'
import type { z } from 'zod'
import { ApiResponse } from './ApiResponse'

// The options Playwright's own request.fetch() accepts (params, data, headers, timeout, …),
// borrowed from its signature instead of re-typing them by hand.
type RequestOptions = Parameters<APIRequestContext['fetch']>[1]

// One request/response pair, kept so a failed test's report shows what was actually exchanged.
export type ApiCall = {
    method: string
    url: string
    requestBody?: unknown
    status: number
    responseBody: unknown
}

// Shared plumbing for every resource client. Subclasses only say *which* URL and *which* schema;
// the generic T is inferred from the schema, so each method returns ApiResponse<the right type>.
export abstract class BaseClient {
    protected readonly request: APIRequestContext
    private readonly log: ApiCall[] | undefined

    // `log` is optional: test fixtures pass one per test, one-off clients (e.g. the worker login) don't.
    constructor(request: APIRequestContext, log?: ApiCall[]) {
        this.request = request
        this.log = log
    }

    protected get<T>(url: string, schema: z.ZodType<T>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.send('GET', url, schema, options)
    }

    protected post<T>(url: string, schema: z.ZodType<T>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.send('POST', url, schema, options)
    }

    protected put<T>(url: string, schema: z.ZodType<T>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.send('PUT', url, schema, options)
    }

    protected patch<T>(url: string, schema: z.ZodType<T>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.send('PATCH', url, schema, options)
    }

    protected delete<T>(url: string, schema: z.ZodType<T>, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.send('DELETE', url, schema, options)
    }

    private async send<T>(method: string, url: string, schema: z.ZodType<T>, options?: RequestOptions): Promise<ApiResponse<T>> {
        const raw = await this.request.fetch(url, { ...options, method })
        this.log?.push({
            method,
            url: raw.url(),
            ...(options?.data !== undefined && { requestBody: redact(options.data) }),
            status: raw.status(),
            responseBody: await readBody(raw)
        })
        return new ApiResponse(raw, schema)
    }
}

// Reports end up in CI artifacts: never put a password in one. Headers (with the bearer token)
// aren't logged at all.
function redact(data: unknown): unknown {
    if (typeof data === 'object' && data !== null && 'password' in data) {
        return { ...data, password: '***' }
    }
    return data
}

// JSON if the body parses as JSON, otherwise the raw text (e.g. an HTML error page).
async function readBody(raw: APIResponse): Promise<unknown> {
    const text = await raw.text()
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}
