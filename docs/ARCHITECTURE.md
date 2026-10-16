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
| `type` vs `interface` | `interface` for object shapes, `type` for unions/utility/mapped types | `type` for everything (`CheckoutInfo`, `CheckoutSummary`, `SortOption`, `MyFixtures`); the one `interface User` in `users.ts` is a leftover to align | One keyword for both shapes and unions keeps the code consistent; we never need `interface`-only features (declaration merging, `extends` chains) | 1 |
| Locator strategy | `getByTestId` (data-test) → `getByRole` → `getByText`; never CSS classes/XPath | `getByTestId` (`testIdAttribute: 'data-test'` in config) by default; `getByRole` for buttons inside a filtered row (`Add to cart`, `Remove`) or without a test ID (`Open Menu`) | saucedemo puts `data-test` on almost everything and those IDs don't change with styling or wording; CSS classes and XPath break on markup changes | 1 |
| File naming | `*.spec.ts` for tests, `*.setup.ts` for setup; `PascalCase.ts` for classes; `camelCase.ts` for data/utils | As recommended: `LoginPage.ts`, `HeaderComponent.ts`; `users.ts`, `money.ts`; `checkout.spec.ts` | The file name tells you what's inside (a class vs data/helpers) and Playwright finds tests by the `.spec.ts` suffix | 2 |
| Imports | relative with `.ts` extension; `import type` for types | Relative, **without** `.ts` extension; `import type` for types (`Page`, `Locator`, `CheckoutInfo`) | Playwright's loader resolves extensionless imports, so the extension adds nothing here; `import type` makes it explicit that the import disappears at runtime | 2 |
| Page object boundary | one class per URL; shared UI as components (`HeaderComponent`) | One class per URL: checkout is split into `CheckoutPage` (step one), `CheckoutOverviewPage` (step two), `CheckoutCompletePage`. `HeaderComponent` is *contained* by pages (composition), not inherited | Each class stays small and maps to one screen, so a broken locator is easy to find. Not every page has a header (login doesn't), so putting it in `BasePage` would give `LoginPage` a header it doesn't have | 2 |
| Where assertions live | tests (+ `expectLoaded()` in pages) | In tests. Page objects only read and return data (`getSummary()`, `getPrices()`); the only `expect` in a page is inside `expectLoaded()` | If a page object computes the expected value (the old `getSummary()` summed prices itself), the test compares the page with itself and can't catch a wrong total. Expected values come from test data (`PRODUCTS`) | 2 |
| Fixture scope | test-scoped for pages/clients; worker-scoped only for expensive shared things (auth tokens) | All test-scoped: page objects + a `loggedIn: void` fixture that composes `loginPage` + `inventoryPage`; specs request it with an empty `beforeEach(async ({ loggedIn }) => {})`. ESLint uses `args: "none"` for `e2e/tests/**` only, because a requested-but-unread fixture is not a bug | Each test gets a fresh page and session, so tests are independent. Login lives in one place, so Phase 3 can swap UI login for `storageState` in one function | 2 |
| Auth strategy (E2E) | `setup` project + `storageState` for default user; `loggedIn` fixture + `user` option for others | `auth.setup.ts` logs in once per role in `LOGIN_ROLES` and writes `authFile(role)`; chromium/firefox load `authFile('standardUser')` with `dependencies: ['setup']`; other roles per spec via `test.use({ storageState: authFile('problemUser') })`; `login.spec.ts` starts logged out (empty `storageState`); `lockedUser` gets no state file | Log in once instead of per test; one file per role keeps role-specific specs one line of config. Every project that loads state must depend on `setup`, or a single-project run fails on a fresh clone | 3 |
| Tags | `@smoke`, `@regression`, feature tags (`@checkout`) | `@smoke` on 3 "user is blocked" paths (standard login, cart add/remove, full checkout); area tags `@login` `@inventory` `@cart` `@checkout`; `@network` on the interception describe. No `@regression` tag: regression = everything minus `@network` (`--grep-invert`) | Smoke must stay small and mean "a user is blocked", or it becomes as slow as the full suite and gets ignored. A tag nobody sets selects 0 tests, so regression is defined by exclusion | 3 |
| Retries | 0 locally, 2 in CI; flaky tests fixed, not retried into green | As recommended: `retries: process.env.CI ? 2 : 0`. The one flake found (Back Home layout shift, Firefox ~10%) was reproduced with `--repeat-each=30 --trace=retain-on-failure` and fixed at the cause (wait for the image), not retried | Locally every failure should be visible; in CI retries absorb network blips but the report still marks the test flaky, which is a bug to fix | 3 |
| API client shape | one client per resource + `BaseClient` + generic `ApiResponse<T>` | As recommended. `BaseClient` has protected generic `get/post/put/patch<T>(url, schema, options)` (+ `delete` returning the raw `APIResponse`); `UsersClient` / `AuthClient` are one-line methods named after the action (`getUser`, `createUser`, `login`). `ApiResponse<T>` exposes `status` and `body()` separately; `bodyAs(schema)` for error/404 bodies | Tests never build URLs or parse JSON. T is inferred from the schema, so every method returns the right type for free. Status is asserted before the body, so a 500 fails as "expected 200, received 500", not as a schema error. Method names like `getUser` avoid clashing with the inherited `get`/`patch`/`delete` | 4 |
| Schema validation lib | zod (TS-native, types inferred from schemas) | zod 4; one `*.schema.ts` per area; every schema exports its `z.infer` type; `z.object` (extra keys ignored and stripped) except `z.strictObject({})` for the exact-`{}` 404 | Schema and type come from one source and can't drift. reqres adds changing `_meta` marketing fields, so a non-strict object keeps tests stable while still checking every field we use | 4 |
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
