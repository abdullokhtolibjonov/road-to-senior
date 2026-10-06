# Architecture & Conventions

This file is a living record of *decisions*. For each topic below there's a **recommended
default** so you're never blocked — but fill in the "Decision" and "Why" columns yourself when you
actually make the call. Writing the *why* is the point: it stops you re-litigating choices three
files later, and it's exactly what you'll be asked about in interviews.

## Layering

```
tests (*.spec.ts)             ← describe behavior, contain assertions
   │ use
   ▼
fixtures (fixtures/test.ts)   ← build and inject page objects / clients / logged-in state
   │ create
   ▼
page objects / API clients    ← know HOW: locators, URLs, endpoints, schemas
   │ use
   ▼
Playwright / k6 primitives    ← page, locator, request, http

shared: config (URLs, keys), test data (constants, factories), utils (money, dates)
```

Rules:
- Tests never call `page.locator(...)`, `getByTestId(...)` or `request.get(...)` directly — only
  page objects / clients.
- Page objects never contain business assertions (the test decides what "correct" means). Small
  "am I on the right page" helpers like `expectLoaded()` are allowed.
- Page objects never import from tests; lower layers never import from higher ones.
- Config comes from one typed place, not `process.env` scattered around.

## Conventions Log

| Topic | Recommended default | Decision | Why | Phase |
|---|---|---|---|---|
| `type` vs `interface` | `interface` for object shapes, `type` for unions/utility/mapped types | | | 1 |
| Locator strategy | `getByTestId` (data-test) → `getByRole` → `getByText`; never CSS classes/XPath | | | 1 |
| File naming | `*.spec.ts` for tests, `*.setup.ts` for setup; `PascalCase.ts` for classes; `camelCase.ts` for data/utils | | | 2 |
| Imports | relative with `.ts` extension; `import type` for types | | | 2 |
| Page object boundary | one class per URL; shared UI as components (`HeaderComponent`) | | | 2 |
| Where assertions live | tests (+ `expectLoaded()` in pages) | | | 2 |
| Fixture scope | test-scoped for pages/clients; worker-scoped only for expensive shared things (auth tokens) | | | 2 |
| Auth strategy (E2E) | `setup` project + `storageState` for default user; `loggedIn` fixture + `user` option for others | | | 3 |
| Tags | `@smoke`, `@regression`, feature tags (`@checkout`) | | | 3 |
| Retries | 0 locally, 2 in CI; flaky tests fixed, not retried into green | | | 3 |
| API client shape | one client per resource + `BaseClient` + generic `ApiResponse<T>` | | | 4 |
| Schema validation lib | zod (TS-native, types inferred from schemas) | | | 4 |
| k6 + TypeScript | k6 ≥ 1.0 native TS; `@types/k6`; separate `performance/k6/tsconfig.json` | | | 5 |
| k6 targets | public QuickPizza for smoke/load; local QuickPizza (Docker) for stress/spike | | | 5 |
| Test data strategy | constants for fixed facts (users, products); faker factories for input data | | | 6 |
| Reporter(s) | `list` + `html` locally; + `github` (+ `junit`) in CI; Allure optional | | | 6 |
| CI browser install | `npx playwright install --with-deps <browser>` per matrix job, no browser cache | | | 7 |

## Environment Config Strategy

Three different targets → three separate settings, never one shared `BASE_URL`:

| Suite | Setting | Where |
|---|---|---|
| E2E | `https://www.saucedemo.com` | `use.baseURL` of chromium/firefox projects |
| API | `https://reqres.in` + `x-api-key` header | `use.baseURL` / `extraHTTPHeaders` of the `api` project |
| k6 | `BASE_URL` env var, default QuickPizza | `performance/k6/config.ts` via `__ENV` |

Recommended: a small typed config module for Node-side values, e.g.:

```ts
// shared/config/env.ts
export const env = {
  isCI: !!process.env.CI,
  e2eBaseUrl: process.env.E2E_BASE_URL || 'https://www.saucedemo.com',
  apiBaseUrl: process.env.API_BASE_URL || 'https://reqres.in',
  reqresApiKey: process.env.REQRES_API_KEY || 'reqres-free-v1',
} as const
```
and `playwright.config.ts` imports from it. (Needs Node types — see `TROUBLESHOOTING.md`.) A
`.env` file is optional: Node 20+ can load it with `node --env-file=.env`, or install `dotenv` and
call `dotenv.config()` at the top of `playwright.config.ts`. `.env` is already git-ignored — commit
a `.env.example` with dummy values instead.

Local vs CI differences (keep them few and all in config): retries, workers, `forbidOnly`,
reporters, trace/video mode.

## Definition of Done (per phase)

1. `npm run typecheck` passes with no `any` you can't justify out loud.
2. `npm run lint` passes (no warnings in your own files).
3. Tests pass twice in a row locally (catches obvious flakiness immediately).
4. You can explain every line — if you pasted something you don't understand, it's a TODO, not
   done.
5. The phase's row in `ROADMAP.md` → "Current Status" is updated and the work is committed.
