import type { APIRequestContext } from '@playwright/test'
import type { z } from 'zod'
import { ApiResponse } from './ApiResponse'

// The options Playwright's own request.fetch() accepts (params, data, headers, timeout, …),
// borrowed from its signature instead of re-typing them by hand.
type RequestOptions = Parameters<APIRequestContext['fetch']>[1]

// Shared plumbing for every resource client. Subclasses only say *which* URL and *which* schema;
// the generic T is inferred from the schema, so each method returns ApiResponse<the right type>.
export abstract class BaseClient {
    protected readonly request: APIRequestContext

    constructor(request: APIRequestContext) {
        this.request = request
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
        return new ApiResponse(raw, schema)
    }
}
