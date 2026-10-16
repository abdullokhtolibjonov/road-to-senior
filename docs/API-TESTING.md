# API Testing Plan (Phase 4)

API tests use Playwright's **`request` fixture** (an `APIRequestContext`): real HTTP calls, no
browser. Same runner, same reports, same fixtures system as E2E.

> **Rule for reference solutions:** try first, then open the `<details>` block, then type it
> yourself.

---

## 1. Target: https://dummyjson.com (primary since 2026-10-16)

> **Why not reqres anymore:** on 2026-10-16 reqres.in started answering **429** after
> **40 requests/day per IP** without an account (`X-Ratelimit-Limit: 40`, resets at midnight UTC).
> A suite of ~20 requests could run twice a day, so the target was switched. The reqres notes are
> kept collapsed at the end of this section, and the reference solutions in §3 were written for
> reqres — the real code in `api/` is the dummyjson version.

A fake REST API: real-looking data, **writes are simulated** (the response says what *would* have
happened; nothing is stored). No API key. Rate limit ~**100 requests per ~minute**
(`x-ratelimit-limit: 100`), plenty for this suite — but still no `--repeat-each` on the `api` project.

### Endpoints & real responses (curl-probed 2026-10-16)

| # | Request | Status | Response body (shape) |
|---|---|---|---|
| 1 | `GET /users?limit=5&skip=10` | 200 | `{ users: User[], total, skip, limit }` |
| 2 | `GET /users?limit=5&skip=<total>` | 200 | `users: []` |
| 3 | `GET /users/1` | 200 | `User` (~30 fields: id, firstName, lastName, age, email, username, image, role, address, …) |
| 4 | `GET /users/9999` | 404 | `{ message: "User with id '9999' not found" }` |
| 5 | `GET /users/abc` | 400 | `{ message: "Invalid user id 'abc'" }` |
| 6 | `POST /users/add` `{ firstName, lastName, age }` | 201 | our fields + `id: number`; fields we didn't send come back **empty** (`email: ''`) |
| 7 | `PUT` / `PATCH /users/1` `{ lastName }` | 200 | full user with the change merged in |
| 8 | `DELETE /users/1` | 200 | full user + `isDeleted: true`, `deletedOn: ISO date` |
| 9 | `POST /auth/login` `{ username: 'emilys', password: 'emilyspass' }` | 200 | `{ id, username, email, firstName, lastName, gender, image, accessToken, refreshToken }` (tokens are JWTs) |
| 10 | `POST /auth/login` wrong password / unknown user | 400 | `{ message: 'Invalid credentials' }` |
| 11 | `POST /auth/login` missing password / empty username / `{}` | 400 | `{ message: 'Username and password required' }` |
| 12 | `GET /auth/me` + `Authorization: Bearer <accessToken>` | 200 | `User` |
| 13 | `GET /auth/me` without token | 401 | `{ message: 'Access Token is required' }` |
| 14 | `GET /auth/me` with an invalid token | **500** | `{ message: 'invalid token' }` — **API bug** (should be 401) → `test.fail()` |
| 15 | `GET /users?delay=3000` | 200 | normal list, ~3 s later — for timeout tests |

Always verify with a quick manual call before writing a test (PowerShell):
```powershell
curl.exe -s "https://dummyjson.com/users/1?select=id,firstName,email"
curl.exe -s -i "https://dummyjson.com/users/1" | Select-String ratelimit   # remaining budget
```

> Mock rule: don't write "create then GET to verify persistence" tests — nothing is stored.
> Assert on the response of the write call itself.

<details>
<summary>Old target: reqres.in (dropped 2026-10-16)</summary>

### reqres.in (historical)

A fake REST API: responses look real but **writes are not persisted**.

### API key (important)

Since 2025 reqres.in requires an API-key header on most requests. Without it you get **401
`{"error":"Missing API key"}`**. The free key has been `x-api-key: reqres-free-v1` — check the
reqres.in homepage for the current value if that stops working. Put it in config (see §3), never
hard-code it in tests.

> **Checked 2026-10-16:** the key is currently **not enforced** — `GET /api/users/2`, `POST /api/users`
> and `POST /api/login` all succeed without it (200/201). We still send it (free, and reqres has
> changed this before), but there is no 401 to test right now. Responses also carry extra
> `support`/`_meta` marketing fields — zod ignores unknown keys, so schemas stay small.

### Rate limit

The free tier is rate-limited: after a burst of requests you get **429 Too Many Requests** (seen
when running the API suite with `--repeat-each=3`). So: don't use `--repeat-each` on the `api`
project, run the suite once per CI job, and if you hit 429 just wait a few minutes.

### Endpoints & expected responses

| # | Request | Status | Response body (shape) |
|---|---|---|---|
| 1 | `GET /api/users?page=2` | 200 | `{ page, per_page, total, total_pages, data: User[], support: { url, text } }` |
| 2 | `GET /api/users/2` | 200 | `{ data: User, support: {...} }` |
| 3 | `GET /api/users/23` | 404 | `{}` |
| 4 | `POST /api/users` body `{ name, job }` | 201 | `{ name, job, id: string, createdAt: ISO-date string }` |
| 5 | `PUT /api/users/2` body `{ name, job }` | 200 | `{ name, job, updatedAt }` |
| 6 | `PATCH /api/users/2` body `{ job }` | 200 | `{ job, updatedAt }` |
| 7 | `DELETE /api/users/2` | 204 | *(empty body)* |
| 8 | `POST /api/register` `{ email: 'eve.holt@reqres.in', password: 'pistol' }` | 200 | `{ id: number, token: string }` |
| 9 | `POST /api/register` `{ email: 'sydney@fife' }` (no password) | 400 | `{ error: 'Missing password' }` |
| 10 | `POST /api/register` with an email that isn't a predefined user | 400 | `{ error: 'Note: Only defined users succeed registration' }` |
| 11 | `POST /api/login` `{ email: 'eve.holt@reqres.in', password: 'cityslicka' }` | 200 | `{ token: string }` |
| 12 | `POST /api/login` `{ email: 'peter@klaven' }` (no password) | 400 | `{ error: 'Missing password' }` |
| 13 | `GET /api/users?delay=3` | 200 | same as #1, but ~3 s later — use for timeout tests |

`User` = `{ id: number, email: string, first_name: string, last_name: string, avatar: string (URL) }`.

Notice: the `id` from **POST is a string** (`"523"`), while user ids from GET are **numbers**. A
schema catches exactly this kind of inconsistency.

Always verify with a quick manual call before writing a test (PowerShell):
```powershell
curl.exe -s -H "x-api-key: reqres-free-v1" "https://reqres.in/api/users?page=2"
```
Some responses may contain extra fields (e.g. `_meta`). zod `z.object` ignores unknown keys by
default, so that won't break you.

> Mock rule: don't write "create then GET to verify persistence" tests — the mock doesn't persist.
> Assert on the response of the write call itself.

---


</details>

## 2. Target folder structure

```
api/
├── clients/
│   ├── ApiResponse.ts        # generic typed wrapper around Playwright's APIResponse
│   ├── BaseClient.ts
│   ├── UsersClient.ts
│   └── AuthClient.ts
├── schemas/
│   ├── common.schema.ts      # support block, error body
│   ├── user.schema.ts
│   └── auth.schema.ts
├── fixtures/
│   └── test.ts               # provides usersClient, authClient
├── test-data/
│   └── users.ts              # payloads (faker from Phase 6)
└── tests/
    ├── users.spec.ts
    └── auth.spec.ts
```

---

## 3. Step-by-step

> The reference solutions below were written for **reqres** (endpoints `/api/users`, `x-api-key`,
> `register`). The design (schemas → `ApiResponse<T>` → `BaseClient` → clients → fixtures) is the
> same for dummyjson; see the real code in `api/` for the dummyjson version.

### Step 4.1 — Install zod and add an `api` Playwright project

```bash
npm i -D zod
```

In `playwright.config.ts`, give API tests their own project with their own `testDir` and
`baseURL`. Project-level `use` overrides the top-level `use`.

<details>
<summary>Reference solution</summary>

```ts
// playwright.config.ts — add to `projects`
{
  name: 'api',
  testDir: 'api/tests',
  use: {
    baseURL: 'https://reqres.in',
    extraHTTPHeaders: {
      // `||` not `??`: in CI an unset secret arrives as an empty string '', and '' ?? x === ''
      'x-api-key': process.env.REQRES_API_KEY || 'reqres-free-v1',
    },
  },
},
```

package.json scripts:
```json
"test": "playwright test",
"test:e2e": "playwright test --project=chromium --project=firefox",
"test:api": "playwright test --project=api"
```
(The `setup` project runs automatically when a project depends on it.)

`process.env` requires Node types — see `TROUBLESHOOTING.md` → "Cannot find name 'process'".
</details>

### Step 4.2 — Schemas (`api/schemas/`)

Write the schema first, derive the TypeScript type from it (`z.infer`). If the API shape changes,
you update one schema and the compiler shows every place that relied on the old shape.

Zod cheat sheet (zod v4 — what `npm i zod` installs today):

| Need | zod |
|---|---|
| object | `z.object({ a: z.string() })` |
| number that must be an integer | `z.number().int()` |
| email / url | `z.email()` / `z.url()` (v3: `z.string().email()` / `.url()`) |
| ISO date-time string | `z.iso.datetime()` (v3: `z.string().datetime()`) |
| array | `z.array(UserSchema)` |
| exact literal | `z.literal('Missing password')` |
| no extra keys allowed | `z.strictObject({...})` |
| empty object `{}` | `z.strictObject({})` |
| type | `type User = z.infer<typeof UserSchema>` |
| parse (throws) / safe parse | `Schema.parse(data)` / `Schema.safeParse(data)` → `{ success, data \| error }` |
| readable error text | `z.prettifyError(result.error)` |

<details>
<summary>Reference solution</summary>

```ts
// api/schemas/common.schema.ts
import { z } from 'zod'

export const SupportSchema = z.object({
  url: z.url(),
  text: z.string(),
})

export const ErrorBodySchema = z.object({
  error: z.string().min(1),
})
export type ErrorBody = z.infer<typeof ErrorBodySchema>

export const EmptyObjectSchema = z.strictObject({})
```

```ts
// api/schemas/user.schema.ts
import { z } from 'zod'
import { SupportSchema } from './common.schema.ts'

export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  avatar: z.url(),
})
export type User = z.infer<typeof UserSchema>

export const UserListSchema = z.object({
  page: z.number().int(),
  per_page: z.number().int(),
  total: z.number().int(),
  total_pages: z.number().int(),
  data: z.array(UserSchema),
  support: SupportSchema,
})
export type UserList = z.infer<typeof UserListSchema>

export const SingleUserSchema = z.object({
  data: UserSchema,
  support: SupportSchema,
})

// ---- writes ----
export const UserPayloadSchema = z.object({
  name: z.string(),
  job: z.string(),
})
export type UserPayload = z.infer<typeof UserPayloadSchema>

export const CreatedUserSchema = UserPayloadSchema.extend({
  id: z.string().min(1),          // string on create!
  createdAt: z.iso.datetime(),
})

export const UpdatedUserSchema = UserPayloadSchema.partial().extend({
  updatedAt: z.iso.datetime(),
})
```

```ts
// api/schemas/auth.schema.ts
import { z } from 'zod'

export const CredentialsSchema = z.object({
  email: z.string(),
  password: z.string().optional(),
})
export type Credentials = z.infer<typeof CredentialsSchema>

export const RegisterSuccessSchema = z.object({
  id: z.number().int(),
  token: z.string().min(1),
})

export const LoginSuccessSchema = z.object({
  token: z.string().min(1),
})
```
Note on `exactOptionalPropertyTypes` (on in your tsconfig): `password?: string` means "may be
absent", **not** "may be `undefined`". So `{ email, password: undefined }` is a type error — just
leave the key out.
</details>

### Step 4.3 — Typed client layer

Design goals:
1. Tests never call `request.get(...)` directly — only client methods.
2. **Status assertions stay separate from schema validation** — a 500 should fail on the status
   check with a clear message, never reach schema parsing.
3. Bodies come back **typed** (from the schema), never `any`.

Approach: a small generic class `ApiResponse<T>` that wraps Playwright's `APIResponse` and knows
which schema describes the success body.

<details>
<summary>Reference solution</summary>

```ts
// api/clients/ApiResponse.ts
import type { APIResponse } from '@playwright/test'
import { z } from 'zod'

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

  /** Validates the body against the success schema and returns it typed. */
  async body(): Promise<T> {
    return this.parseWith(this.schema)
  }

  /** Validates the body against any other schema (e.g. an error body). */
  async bodyAs<U>(schema: z.ZodType<U>): Promise<U> {
    return this.parseWith(schema)
  }

  private async parseWith<U>(schema: z.ZodType<U>): Promise<U> {
    const json: unknown = await this.raw.json()
    const result = schema.safeParse(json)
    if (!result.success) {
      throw new Error(
        `Schema validation failed for ${this.raw.url()} (status ${this.status}):\n` +
          `${z.prettifyError(result.error)}\nBody: ${JSON.stringify(json, null, 2)}`,
      )
    }
    return result.data
  }
}
```

```ts
// api/clients/BaseClient.ts
import type { APIRequestContext } from '@playwright/test'

export abstract class BaseClient {
  protected readonly request: APIRequestContext

  constructor(request: APIRequestContext) {
    this.request = request
  }
}
```

```ts
// api/clients/UsersClient.ts
import type { APIResponse } from '@playwright/test'
import { BaseClient } from './BaseClient.ts'
import { ApiResponse } from './ApiResponse.ts'
import {
  UserListSchema, SingleUserSchema, CreatedUserSchema, UpdatedUserSchema,
  type UserPayload,
} from '../schemas/user.schema.ts'

export class UsersClient extends BaseClient {
  async list(page = 1) {
    const res = await this.request.get('/api/users', { params: { page } })
    return new ApiResponse(res, UserListSchema)
  }

  async get(id: number) {
    const res = await this.request.get(`/api/users/${id}`)
    return new ApiResponse(res, SingleUserSchema)
  }

  async create(payload: UserPayload) {
    const res = await this.request.post('/api/users', { data: payload })
    return new ApiResponse(res, CreatedUserSchema)
  }

  async update(id: number, payload: UserPayload) {
    const res = await this.request.put(`/api/users/${id}`, { data: payload })
    return new ApiResponse(res, UpdatedUserSchema)
  }

  async patch(id: number, payload: Partial<UserPayload>) {
    const res = await this.request.patch(`/api/users/${id}`, { data: payload })
    return new ApiResponse(res, UpdatedUserSchema)
  }

  /** DELETE returns no body, so there's nothing to validate — return the raw response. */
  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/users/${id}`)
  }
}
```
Return types are inferred here (`Promise<ApiResponse<{...}>>`) — hover them in VS Code. That's a
deliberate "let inference work" choice; write them explicitly if you prefer.

```ts
// api/clients/AuthClient.ts
import { BaseClient } from './BaseClient.ts'
import { ApiResponse } from './ApiResponse.ts'
import { RegisterSuccessSchema, LoginSuccessSchema, type Credentials } from '../schemas/auth.schema.ts'

export class AuthClient extends BaseClient {
  async register(credentials: Credentials) {
    const res = await this.request.post('/api/register', { data: credentials })
    return new ApiResponse(res, RegisterSuccessSchema)
  }

  async login(credentials: Credentials) {
    const res = await this.request.post('/api/login', { data: credentials })
    return new ApiResponse(res, LoginSuccessSchema)
  }
}
```
</details>

### Step 4.4 — Fixtures (`api/fixtures/test.ts`)

Same idea as E2E: tests receive ready-made clients.

<details>
<summary>Reference solution</summary>

```ts
// api/fixtures/test.ts
import { test as base, expect } from '@playwright/test'
import { UsersClient } from '../clients/UsersClient.ts'
import { AuthClient } from '../clients/AuthClient.ts'

interface ApiFixtures {
  usersClient: UsersClient
  authClient: AuthClient
}

export const test = base.extend<ApiFixtures>({
  usersClient: async ({ request }, use) => {
    await use(new UsersClient(request))
  },
  authClient: async ({ request }, use) => {
    await use(new AuthClient(request))
  },
})

export { expect }
```
The built-in `request` fixture already uses the project's `baseURL` and `extraHTTPHeaders`.
</details>

### Step 4.5 — Tests

Pattern for every test — **three separate steps**:
1. call the client
2. assert status (`expect(res.status).toBe(200)`) — fail fast with a clear message
3. parse body with the schema (`await res.body()`), then assert business values

<details>
<summary>Reference solution</summary>

```ts
// api/tests/users.spec.ts
import { test, expect } from '../fixtures/test.ts'
import { EmptyObjectSchema } from '../schemas/common.schema.ts'

test.describe('Users API', () => {
  test('GET list returns page 2 with valid users', async ({ usersClient }) => {
    const res = await usersClient.list(2)
    expect(res.status).toBe(200)

    const body = await res.body()
    expect(body.page).toBe(2)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data.length).toBeLessThanOrEqual(body.per_page)
  })

  test('GET single user', async ({ usersClient }) => {
    const res = await usersClient.get(2)
    expect(res.status).toBe(200)
    const { data } = await res.body()
    expect(data.id).toBe(2)
  })

  test('GET unknown user returns 404 with empty body', async ({ usersClient }) => {
    const res = await usersClient.get(23)
    expect(res.status).toBe(404)
    await res.bodyAs(EmptyObjectSchema)   // throws if the body isn't exactly {}
  })

  test('POST creates a user', async ({ usersClient }) => {
    const payload = { name: 'Neo', job: 'The One' }
    const res = await usersClient.create(payload)
    expect(res.status).toBe(201)

    const body = await res.body()
    expect(body).toMatchObject(payload)
    expect(body.id).toBeTruthy()
  })

  test('PUT updates a user', async ({ usersClient }) => {
    const res = await usersClient.update(2, { name: 'Neo', job: 'Architect' })
    expect(res.status).toBe(200)
    const body = await res.body()
    expect(body.job).toBe('Architect')
  })

  test('DELETE returns 204 with no body', async ({ usersClient }) => {
    const res = await usersClient.delete(2)
    expect(res.status()).toBe(204)
    expect(await res.text()).toBe('')
  })
})
```

```ts
// api/tests/auth.spec.ts
import { test, expect } from '../fixtures/test.ts'
import { ErrorBodySchema } from '../schemas/common.schema.ts'

test.describe('Auth API', () => {
  test('register succeeds for a defined user', async ({ authClient }) => {
    const res = await authClient.register({ email: 'eve.holt@reqres.in', password: 'pistol' })
    expect(res.status).toBe(200)
    const body = await res.body()
    expect(body.token.length).toBeGreaterThan(0)
  })

  test('register without password fails', async ({ authClient }) => {
    const res = await authClient.register({ email: 'sydney@fife' })
    expect(res.status).toBe(400)
    const err = await res.bodyAs(ErrorBodySchema)
    expect(err.error).toBe('Missing password')
  })

  test('login succeeds', async ({ authClient }) => {
    const res = await authClient.login({ email: 'eve.holt@reqres.in', password: 'cityslicka' })
    expect(res.status).toBe(200)
    expect((await res.body()).token).toBeTruthy()
  })

  test('login without password fails', async ({ authClient }) => {
    const res = await authClient.login({ email: 'peter@klaven' })
    expect(res.status).toBe(400)
    expect((await res.bodyAs(ErrorBodySchema)).error).toBe('Missing password')
  })
})
```
</details>

### Step 4.6 — Prove schema validation works (exit criterion)

Temporarily change `id: z.number()` to `id: z.string()` in `UserSchema`, run `npm run test:api`,
and read the error. It should say which path (`data[0].id`) failed and why. Revert.

Also try a timeout test: `request.get('/api/users', { params: { delay: 3 }, timeout: 1000 })`
should throw — assert with `await expect(promise).rejects.toThrow(/Timeout/)`.

---

## 4. Test checklist (dummyjson — all done 2026-10-16, 20 tests)

- [x] Search (`/users/search?q=`) — matches contain the query; no match → `users: []`, `total: 0` (added in 4.6 as the "new endpoint in < 15 min" check)

- [x] GET list — 200, `limit`/`skip` echoed, `users.length === limit`, ids unique
- [x] GET list past the end — `skip = total` (read from the API, not hard-coded) → `users: []`
- [x] GET single — 200, schema valid, `id` and `username` match
- [x] GET invalid ids (data-driven) — `9999` → 404, `'abc'` → 400, exact `message`
- [x] POST create — 201, `toMatchObject(payload)`, id checked by schema
- [x] PUT and PATCH — 200, change applied, untouched fields kept
- [x] DELETE — 200, `isDeleted: true` (schema literal), `deletedOn` close to now
- [x] Login success — 200, `id`/`username`, both tokens are JWTs (schema regex)
- [x] Login errors (data-driven) — wrong password, unknown user, missing password, empty username
- [x] `/auth/me` with a token from a **worker-scoped** `accessToken` fixture — 200, right user
- [x] `/auth/me` without token — 401 `Access Token is required`
- [x] `/auth/me` with an invalid token — expects 401, gets 500 → `test.fail()` (API bug)
- [x] Delayed endpoint vs a 1 s client timeout — rejects with `Timeout 1000ms exceeded`

## 5. dummyjson auth token + worker fixture (now part of the main suite — see `api/fixtures/test.ts`)

dummyjson **also simulates writes** (POST/PUT/DELETE return what would have happened; nothing is
stored), but it has a proper login flow that returns a JWT — ideal to practice authenticated
clients.

| Request | Notes |
|---|---|
| `POST /auth/login` `{ username: 'emilys', password: 'emilyspass' }` | returns `{ accessToken, refreshToken, id, username, email, ... }` — test user from dummyjson docs, check `/users` if it changed |
| `GET /auth/me` with header `Authorization: Bearer <accessToken>` | current user; 401 without token |
| `GET /products?limit=10&skip=10` | pagination: `{ products, total, skip, limit }` |
| `GET /products/1` / `POST /products/add` / `PUT /products/1` / `DELETE /products/1` | CRUD (simulated) |

Pattern: a **worker-scoped** fixture logs in once per worker process and shares the token; a
test-scoped fixture builds an authenticated request context from it.

<details>
<summary>Reference solution</summary>

```ts
// api/fixtures/dummyjson.ts
import { test as base, expect, type APIRequestContext } from '@playwright/test'
import { z } from 'zod'

const LoginResponseSchema = z.object({ accessToken: z.string().min(1) })
const BASE_URL = 'https://dummyjson.com'

interface TestFixtures {
  authedRequest: APIRequestContext
}
interface WorkerFixtures {
  accessToken: string
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  accessToken: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: BASE_URL })
      const res = await ctx.post('/auth/login', {
        data: { username: 'emilys', password: 'emilyspass' },
      })
      expect(res.status()).toBe(200)
      const { accessToken } = LoginResponseSchema.parse(await res.json())
      await ctx.dispose()
      await use(accessToken)
    },
    { scope: 'worker' },
  ],

  authedRequest: async ({ playwright, accessToken }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
    })
    await use(ctx)
    await ctx.dispose()
  },
})

export { expect }
```
Worker fixtures can't depend on test fixtures (the `request` fixture is test-scoped), which is why
this uses `playwright.request.newContext` directly.
</details>

---

## 6. Decisions to record in `ARCHITECTURE.md`

- One client per resource (`UsersClient`, `AuthClient`) + shared `BaseClient` / `ApiResponse<T>`.
- `request` context comes from the Playwright fixture (never created in tests).
- zod over ajv: schemas are TypeScript, types are inferred, no separate JSON-Schema files.

## 7. Explicitly out of scope

- Contract testing tools (Pact) — stretch only.
- Load testing APIs from this suite — that's k6's job, and reqres/dummyjson are **not** valid load
  targets (see `PERFORMANCE-TESTING.md`).
