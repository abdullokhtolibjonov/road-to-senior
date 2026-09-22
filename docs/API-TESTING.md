# API Testing Plan

## Target: https://reqres.in (primary)

A predictable fake REST API. Endpoints to cover:

| Endpoint | Method | Notes |
|---|---|---|
| `/api/users?page=2` | GET | List with pagination — assert pagination fields, not just status 200 |
| `/api/users/2` | GET | Single resource |
| `/api/users/23` | GET | Non-existent → 404, assert error shape too |
| `/api/users` | POST | Create — assert echoed fields + generated `id`/`createdAt` |
| `/api/users/2` | PUT/PATCH | Update — assert echoed fields + `updatedAt` |
| `/api/users/2` | DELETE | Assert 204, no body |
| `/api/register` | POST | Success + "missing password" failure case (400) |
| `/api/login` | POST | Success + failure case |

> Note: reqres.in is a mock — writes aren't persisted. Don't write a test that creates then reads
> back to verify persistence; that's testing the mock's limitation, not your client. Assert on the
> response of the write call itself.

## Stretch Target: https://dummyjson.com

Has real-ish persistence semantics within a session and a login flow that issues a token — better
for practicing an authenticated API client (attach `Authorization` header via a fixture, similar to
the E2E `authenticatedPage` fixture). Do this after reqres.in feels solid, not in parallel.

## Architecture

```
api/
├── clients/
│   └── UsersClient.ts       # typed methods: getUsers(), getUser(id), createUser(payload)...
├── schemas/
│   └── user.schema.ts       # zod schema(s), types inferred from schema
├── test-data/
│   └── users.ts             # factory functions (faker-based from Phase 6 onward)
└── tests/
    ├── users.spec.ts
    └── auth.spec.ts
```

### Client design questions to resolve (record in ARCHITECTURE.md)

- One client class per resource (`UsersClient`) vs a single generic `ApiClient` with typed
  endpoint-calling methods? Either works; a single resource here makes "one class" simplest, but
  decide deliberately.
- Where does the base URL / Playwright `request` context get created — a fixture, or a factory
  function each test file calls?
- How do you separate "did the HTTP call succeed" assertions from "does the body match the
  schema" assertions? Keep them as distinct assertion steps so failures are legible (a 500 should
  never even reach schema validation).

## Schema Validation

Use `zod`:
```
// shape only — you write the real thing
const userSchema = z.object({ ... })
type User = z.infer<typeof userSchema>
```
The type comes *from* the schema, not the other way around — if the API's real shape drifts, you
update one schema and TypeScript flags every place that assumed the old shape.

## Test List (build incrementally)

- [ ] GET list — status 200, schema valid, pagination fields present and correctly typed (numbers,
      not numeric strings)
- [ ] GET single — status 200, schema valid
- [ ] GET non-existent — status 404, body shape for the error case (reqres returns `{}`  — decide
      how you assert "empty object" meaningfully)
- [ ] POST create — status 201, echoed fields match payload, `id` present
- [ ] PUT/PATCH update — status 200, `updatedAt` present
- [ ] DELETE — status 204, empty body
- [ ] POST register success — status 200, token present
- [ ] POST register missing password — status 400, error message present
- [ ] POST login success/failure — mirror register cases

## Explicitly Out of Scope

- No contract testing tooling (Pact etc.) — that's a stretch idea only if everything else is done.
- No load testing of the API from this suite — that's k6's job, and reqres.in is not a valid k6
  target (see `PERFORMANCE-TESTING.md`).
