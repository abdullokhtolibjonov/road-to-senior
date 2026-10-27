import { test } from '@playwright/test'

// Runs a page-object action as a named step, so the report reads like prose instead of a list of
// raw clicks. `box: true` makes a failure point at the test line that called the method, not at
// a line inside the page object; the step title says which action broke.
export function step<T>(title: string, body: () => Promise<T>): Promise<T> {
    return test.step(title, body, { box: true })
}
