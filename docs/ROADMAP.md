# Roadmap

A phased curriculum. Each phase has a **deliverable** (what exists at the end), a **TypeScript
focus** (new language concepts you should deliberately use, not just stumble into), **step-by-step
tasks**, and **exit criteria** (how you know you're actually done, not just "it ran once").

Don't skip ahead when bored — the later phases assume the earlier ones are solid, especially the
TypeScript config and POM foundations. Do feel free to re-order Phase 4 (API) before Phase 3
(advanced E2E) if you want more variety.

> **How to use these docs without an AI assistant**
>
> 1. Read the phase below, then the matching deep-dive doc (`E2E-TESTING.md`, `API-TESTING.md`, …).
> 2. Try each step yourself using the hints. Only then open the collapsed **"Reference solution"**
>    blocks (`<details>`) — compare, don't copy blindly.
> 3. When stuck on an error, check `TROUBLESHOOTING.md` first, then the official docs linked there.
> 4. After each step: `npm run typecheck`, `npm run lint`, run the tests. Commit when green.

---

## Current Status (as of 2026-10-27)

| Phase | Status | Notes |
|---|---|---|
| 0 — Environment | ✅ done | `playwright-report/` is ignored and lint passes. Optional: also ignore `test-results/`, `blob-report/` and the Allure folders (step 6) |
| 1 — Playwright fundamentals | ✅ done | |
| 2 — POM & architecture | ✅ done | 7 page objects + `HeaderComponent`, typed test data, fixtures incl. `loggedIn`; login/inventory/cart/checkout specs green; `ARCHITECTURE.md` Phase 1–2 rows filled |
| 3 — Advanced E2E | ✅ done | All 7 steps + deliverable gaps done; scenario list 17 done / 0 partial / 11 open (optional extras). Exit run (chromium + firefox, `--repeat-each=5`) 215/215 green on 2026-10-16 after fixing a layout-shift flake |
| 4 — API | ✅ done | dummyjson (reqres dropped: 40 req/day); 20 API tests, ~4s; exit checks passed 2026-10-16. Optional: time yourself adding `/users/filter` | See "Phase 4 — progress" below |
| 5 — k6 | ✅ done | 2026-10-18: k6 v2.2.0 (winget) + `@types/k6`; own `performance/k6/tsconfig.json`, root excludes `performance/`, typecheck runs both; step 5.1 done (`config.ts`, `lib/requests.ts`, 3/3 checks green vs public QuickPizza). Docker not installed: needed for local QuickPizza before stress/spike. Step 5.2 smoke done: `scenarios/smoke.ts` + `npm run perf:smoke` (1 VU × 5 iters, 15/15 checks, p95 ≈ 295ms, exit 0). Step 5.3 load done: `scenarios/load.ts` + `npm run perf:load` (0→10→0 VUs over 2m, 752 reqs, p95 294ms, pizza p95 300ms, 1 failed home request = 0.13% → all thresholds ✓, exit 0). Step 5.6 export done early (no Docker needed): `npm run perf:load:report` → `results/load-summary.json` + `load-report.html` (k6 doesn't create the folder → `perf:results-dir`; HTML skipped on runs as short as smoke); impossible `p(95)<1` → exit 99 confirmed. Steps 5.4 stress + 5.5 spike **moved to Phase 7** (no Docker locally; run them in CI against a QuickPizza service container). `ARCHITECTURE.md` Phase 5 rows filled. Exit check passed 2026-10-18: pizza `p(95)<250` → ✗ exit 99 at p95 303ms; explained as a limit below the no-load baseline (pizza p95 ≈ 295ms at 1 VU vs ≈ 303ms at 10 VUs, 0 errors; dashboard charts mix all endpoints, per-tag over time needs `--out json`), not load degradation |
| 6 — Reporting & data | 🟡 in progress | 2026-10-27: steps 6.1–6.2 done — `@faker-js/faker` installed; `shared/test-data/factories.ts` with `makeCheckoutInfo(overrides?)` + `makeUserPayload(overrides?)` (`Partial<T>` overrides spread last). Step 6.3 done: `checkout.spec.ts` happy path uses `makeCheckoutInfo()`, the 3 error cases use `makeCheckoutInfo({ <field>: '' })`; `POST /users/add` uses `makeUserPayload()` (`NEW_USER` kept for PUT). 13/13 checkout (chromium + firefox incl. setup) + 20/20 API green. Seeding (`faker.seed`) deferred to step 6.7, where the report must show the data. Step 6.4 done: reporters `list` + `html` (`open: 'never'`) locally; with `CI` set also `github` + `junit` → `results/junit.xml` (`/results/` gitignored). Checked both branches (`CI=1` run wrote junit.xml, 20 tests / 0 failures). Step 6.5 done: `e2e/utils/step.ts` wraps `test.step(title, body, { box: true })`; every page-object action/`goto`/`expectLoaded` is a named step (`Add "Sauce Labs Backpack" to cart`, `Fill checkout info {…}` with the random values, login title has the username only). 47/47 E2E green; a deliberate failure is reported as `› Add "No Such Product" to cart` pointing at the test line. Step 6.6 done (Allure 3, no Java): `allure-playwright` reporter → `allure-results/` (local + CI), `shared/global-setup.ts` clears it per run (20 then 47 results, not 67), `npm run report:allure` / `report:allure:open` (served HTTP 200); our step titles appear in Allure. `allure` ≥3.21 pins `dompurify` 3.4.16 (7 critical audit alerts) → `overrides: { dompurify: 3.4.17 }` in package.json, audit 0 — remove the override once allure ships a fixed dompurify. Next: step 6.7 attach data on failure (+ `faker.seed`) |
| 7 — CI/CD | ⬜ | |
| 8 — Native mobile (Appium + WebdriverIO) | ⬜ | Android only (Windows); app: WebdriverIO Native Demo App |

Update this table as you go — it's your progress log.

### Phase 3 — next session (updated 2026-10-14, end of day)

**State (2026-10-14, end of day):** typecheck clean, 41 tests green (5 setup + 18 chromium + 18 firefox).
Scenario list (`E2E-TESTING.md` §4): **12 done, 5 partial, 11 open**.

**Done 2026-10-12 (Phase 3):** step 1 — scenario list reviewed against existing tests; step 2 —
data-driven login errors in `login.spec.ts` (`LoginErrorCase` type + `errorCases` array + `for`
loop inside `test.describe`, 4 cases using `USER_ROLES`/`PASSWORD`/`MESSAGES`);
`LoginPage.login(username, password)` added and `loginAs(role)` now calls it; `PASSWORD` exported.

**Done 2026-10-13 (Phase 3):** step 3 — `storageState`. `e2e/tests/auth.setup.ts` logs in once and
saves `playwright/.auth/standard.json`; `setup` project + `chromium` has `dependencies: ['setup']`
and `use.storageState`; `loggedIn` fixture now just `inventoryPage.goto()` + `expectLoaded()`;
`login.spec.ts` starts logged out via `test.use({ storageState: { cookies: [], origins: [] } })`.

**Done 2026-10-14 (Phase 3):** step 4 — `e2e/tests/network.spec.ts`: images blocked (`route.abort()`)
→ 6 items + add to cart still work; images delayed 1500ms (`route.continue()`) → page still works;
`**/inventory.html` faked as 500 (`route.fulfill`) → status 500, "Server error" visible, 0 items.
Each image test counts matched requests (`blocked`/`delayed`) to prove the route actually fired.

**Learned:** a floating promise (calling an `async` method without `await`) can pass tests by luck
and hide failures — every async call needs `await`; data-driven tests need unique titles; spec files
shouldn't `export` anything; assert the error first, then "still on login page" (otherwise the URL
check passes before the login request finishes).
`storageState` is two halves — *saving* (setup project) does nothing unless the project also
*loads* it (`use.storageState`); `dependencies` goes next to `use`, not inside it; the default
`testMatch` only picks `*.spec.ts`/`*.test.ts`, so `*.setup.ts` isn't run twice.
Runtime went ~4.4s → ~6.3s: with only 6 logged-in tests the serial setup step costs more than it
saves (SauceDemo login is instant and client-side); the win grows with suite size and slow logins.
Network interception = create a problem on purpose (route) → use the app → assert what the *user*
sees. Register `page.route` **before** the navigation; that's why `network.spec.ts` skips `loggedIn`.
Each test's routes live only in its own page — other specs run on a normal network. Prove the fake
ran (request counter / `response.status()`), but the real assertion is user-facing. `page.goto`
doesn't throw on HTTP 500 (only on network errors); it returns `Response | null`.
`expect` on a plain value needs no `await`; only locator assertions retry.
"Locator not found" → first check you're on the page you think (failure screenshot).

**Optional:** enable `@typescript-eslint/no-floating-promises` (needs type-aware linting in
`eslint.config.mjs`) so a missing `await` becomes a lint error. Optional: import
`STANDARD_AUTH_FILE` in `playwright.config.ts` instead of repeating the path string.

**Done 2026-10-14 (Phase 3):** step 5 — tags. `@smoke` on 3 tests: standard login → inventory,
add 2 / remove 1 in cart, complete checkout with totals (the "buy something" path: if any of these
breaks, a user is completely blocked). Area tags `@login`, `@cart`, `@inventory`, `@checkout`.
`network.spec.ts` wrapped in `test.describe('network interception tests', { tag: '@network' }, ...)`.
Scripts: `test:smoke` (`--grep @smoke` → 4 incl. setup, ~4.4s) and `test:regression`
(`--grep-invert @network` → 12 incl. setup, ~6.4s).

**Learned (step 5):** smoke = "is a user completely blocked?" — the login *happy path* is smoke,
the error messages are not (a wrong message doesn't block anyone, so "locked out user" is not smoke).
A `describe` callback must be **synchronous** — it only registers tests; an `await` inside would
silently drop the tests after it. `--grep` is a regex over title + tags; `--grep X --grep-invert Y`
means "matches X **and** not Y", so a tag nobody has (`@regression`) selects 0 tests.
CLI shape is `npx playwright <command> <options>` — `--grep` belongs to `test`, so
`npx playwright --grep-invert ...` fails with `unknown option`.
Open question to answer: what's the risk if smoke grows to 10/14 tests?

**Done 2026-10-14 (Phase 3):** step 6 — Firefox. `firefox` project (`devices['Desktop Firefox']`,
same `storageState`, `dependencies: ['setup']`). Full suite: 29 tests (1 setup + 14 + 14), all green,
~34s (was ~7.5s chromium-only); Firefox alone ~28s. No Firefox-specific failures.
Smoke question answered: smoke must stay small — at 10/14 it's as slow as the full suite and a red
smoke run no longer means "users are blocked", so people start ignoring it.

**Learned (step 6):** a project is a named set of settings; every test runs once per project.
**Every** project that loads `storageState` needs its own `dependencies: ['setup']` — without it,
`npx playwright test` passes by luck (chromium triggers setup) but `--project=firefox` on a fresh
clone / CI fails with `Error reading storage state`. Verified by removing the state file.

**Open questions (step 6):** why did runtime go 7.5s → 34s instead of ~15s (hint: Firefox startup per
worker vs. per test)? Should smoke run on every browser or just one?
Optional extras not done: `webkit` project, a mobile web project (`devices['Pixel 7']`).

**Done 2026-10-14 (Phase 3):** step 7 — `retries: process.env.CI ? 2 : 0` in `playwright.config.ts`;
`npx playwright test --project=chromium --project=firefox --repeat-each=5` fully green (no flaky
tests found). `tsconfig.json` changed `"types": []` → `"types": ["node"]` so `process` type-checks.

**Learned (step 7):** `"types": []` (the `tsc --init` default) loads **no** global `@types/*`
packages even if installed; `"types": ["node"]` loads Node's (`process`, `Buffer`, …). Playwright
strips types and never type-checks — tests can be green while `npm run typecheck` fails, which is
why typecheck is a separate step (and a CI gate in Phase 7). Retries 0 locally = see every failure;
2 in CI = tolerate blips but the report still marks them "flaky". Note: `trace`/`video` are
`'on-first-retry'`, so with 0 local retries nothing is recorded locally — use `--trace on` to debug.

**Questions answered 2026-10-14 (steps 6–7):** runtime grows by more than 2× per added browser —
Firefox is slower per test (~2× on cart/checkout) and work ÷ fixed workers; first runs are cold
(measured 28–34s cold vs ~15s warm Firefox) → measure 2–3 times. Smoke on **one** browser
(fast answer; engine-specific bugs belong to regression). Failed = every attempt failed; flaky =
failed then passed on retry in the same run. Retries don't fix the race — they hide real app bugs,
slow the suite and let flakiness grow unnoticed. `waitForTimeout` is wrong both ways (wastes time
when the app is fast, still fails when it's slower); web-first assertions poll and continue as soon
as ready. Optional: `test:smoke` → add `--project=chromium`.

**Done 2026-10-14 (Phase 3, evening):** Task 1 parts A + B — other user types.
`users.ts`: `loginRole = Exclude<Role, 'lockedUser'>`, shared `LOGIN_ROLES` (5 roles),
`authFile(role)` → `playwright/.auth/<role>.json`. `auth.setup.ts`: top-level `for` over
`LOGIN_ROLES` → 5 setup tests, one state file per role (verified: each file's session cookie holds
its own username). Config uses `authFile('standardUser')` for both projects. `login.spec.ts`:
data-driven "logs in and lands on inventory" over `LOGIN_ROLES`; every test `@login`, only
`standardUser` also `@smoke`. Full suite: 41 tests green on chromium + firefox, `tsc` clean.
Committed 2026-10-14 (`8d4ebb5`), cleanups included.

**Learned (Task 1):** `setup()`/`test()` must be called at the file's top level (a loop is fine) —
inside a function nobody calls, 0 tests get registered. Inside a loop, use the loop variable, not
a hard-coded value (`loginAs(role)`, not `loginAs('standardUser')`). "Green + files exist" isn't
proof — check the data (stale `.auth` files hid a broken setup; delete them before verifying).
A `tag` ternary must pick between two **arrays** (`['@smoke','@login']` vs `['@login']`), or the
smoke test loses `@login`. Timeouts: `expect(...)` uses `expect.timeout` (5s); `waitForURL`/`goto`
use the navigation timeout (= test timeout) — so `performance_glitch_user` passes via `expectLoaded`.
`lockedUser` gets no setup: it can't log in, and a failed setup blocks every project.

**Done 2026-10-16 (Phase 3):** Task 1 part C — `problem-user.spec.ts` (state from
`authFile('problemUser')`): `InventoryPage.images` = `getByTestId('inventory-item').getByRole('img')`
(6 product images, skips the burger icon); `srcs` via `.all()` + `Promise.all(map(getAttribute('src')))`;
`expect(new Set(srcs).size).toBe(srcs.length)` under `test.fail()`. Sanity run as `standardUser`
without `test.fail()` passes. Full suite 43 green, `tsc` clean.

**Learned (part C):** `.locator()` after a locator searches *inside* it (`getByRole('img').locator(...)`
→ 0 matches); `getAttribute` needs exactly one element (many → `.all()` + `Promise.all`).
`test.fail()` turns *any* failure green — `getAttribute('img')` returned 6× `null` → Set size 1 →
"bug detected" while the test read nothing. Always run the inverse check (known-good data, no
`test.fail()`). `fail` = runs, must fail, flips red when the bug is fixed; `skip` = doesn't apply
here (browser/env/condition) — an unnecessary test gets deleted, not skipped; `fixme` = test itself
needs work, not run. Assert the rule (`srcs.length`), not today's data (`6`).

**Done 2026-10-16 (Phase 3):** Task 2 — `checkout.spec.ts` step-one errors are data-driven:
`CheckoutErrorCase` (`title`, `info: Partial<CheckoutInfo>`, `error`) + 3 cases + `for` loop in
`test.describe('Checkout step one errors', { tag: ['@checkout'] })`. Each test does
`checkoutPage.goto()` → `fillInfo` → `continue` → assert error → `expectLoaded()`; no cart setup, no
`.clear()`. `problem-user.spec.ts` got its "why" comment above `test.fail()`. Full suite 47 green, `tsc` + lint clean.

**Learned (Task 2):** one test = one reason to fail. The old sequential test stopped at the first
broken case (hid the other two) and depended on leftover form state (`.clear()`). Only set up what
the behaviour under test needs — form validation doesn't read the cart, so skip inventory/cart steps
(faster, fewer unrelated failure points). Workflow from 2026-10-16: Claude implements, user reviews.

**Done 2026-10-16 (Phase 3):** Task 3 — order math in cents. `TAX_RATE = 0.08` in
`test-data/products.ts`, `sumCents()` in `utils/money.ts`. The smoke checkout test converts every
amount with `toCents` and asserts with `toBe`: subtotal = sum of overview item prices = sum of
`PRODUCTS`; tax = `Math.round(subtotal × TAX_RATE)`; total = subtotal + tax. Inverse check: with
`TAX_RATE = 0.07` the test fails (`Expected 322, Received 368`). Full suite 47 green.

**Learned (Task 3):** `0.1 + 0.2 === 0.30000000000000004` — binary floats can't store most decimal
fractions exactly, so money in floats + `toBe` is flaky by design. `toBeCloseTo` hides that but also
hides 1-cent bugs. Convert to integer cents **once** at the boundary (`Math.round(x * 100)`), then do
exact integer math. The old test never checked the tax *rate* — `total ≈ subtotal + tax` passes with
any tax value; a rule from the spec (8%) is what catches a wrong calculation.

**Done 2026-10-16 (Phase 3):** Task 4 — partial scenarios finished. `InventoryPage.cartButtonFor(name)`
(card button, "Add to cart" ↔ "Remove"); inventory test asserts the text flips both ways. Cart test
also checks prices against `PRODUCTS` and the badge (`'1'`) after removing an item.
Exit run found a **flaky** smoke checkout on Firefox (1/215; reproduced 3/30 with `--repeat-each=30`):
the "Pony Express" image above **Back Home** loaded after Playwright measured the button and pushed
it ~72px down → click hit empty space → `waitForURL('/inventory.html')` timed out. Fix in
`CheckoutCompletePage.backHome()`: `expect(ponyImage).toHaveJSProperty('complete', true)` before the
click. After: 0/60 on Firefox, exit run 215/215 green. **Phase 3 done.**

**Learned (Task 4):** `getByRole('button')` matches anything with `role="button"`, not just `<button>`
— add `{ name }` to pick the right one (strict mode caught it). A flaky test is a bug report: don't
add retries or `waitForTimeout`, reproduce it (`--repeat-each=30 --trace=retain-on-failure`), then
find *why*. The trace's `input` event shows where Playwright clicked; comparing it with the failure
screenshot showed the button had moved. Playwright's actionability checks (visible, stable, enabled)
only cover the moment **before** the click — a layout shift during it isn't caught. Fix the race by
waiting for the thing that moves the layout. Firefox-only because image decode timing differs.

**▶ Phase 3 closed.** Phase 4 notes below.

### Phase 4 — progress

**Done 2026-10-16:** step 4.1 — `npm i -D zod` (v4). `api` project in `playwright.config.ts`
(`testDir: 'api/tests'`, `baseURL: 'https://reqres.in'`, `extraHTTPHeaders` with
`x-api-key: process.env.REQRES_API_KEY || 'reqres-free-v1'`, no `dependencies` → no login setup).
Scripts: `test:e2e` = `--project=chromium --project=firefox`, new `test:api` = `--project=api`.
First raw test `api/tests/users.spec.ts` (`request.get('/api/users/2')` → 200, `data.id === 2`), ~1s.
Probed reqres with curl: API key not enforced anymore (200/201 without it) → 401 test dropped.

**Learned (4.1):** a project is a named set of settings — project `use` overrides top-level `use`
(the api project replaces SauceDemo's `baseURL`; `testIdAttribute` etc. are simply unused).
`extraHTTPHeaders` are added to every `request` call, so tests never mention the key.
`||` vs `??`: `??` only replaces `null`/`undefined`; an empty CI secret is `''` → use `||`.
Always probe the real API (curl) before trusting docs — reqres changed its key rule.
`response.json()` returns `any` → `body.data.id` compiles even if `data` doesn't exist; step 4.2 fixes
this with zod.

**Done 2026-10-16:** step 4.2 — schemas. `api/schemas/common.schema.ts` (`SupportSchema`,
`ErrorBodySchema`, `EmptyObjectSchema = z.strictObject({})`), `user.schema.ts` (`UserSchema`,
`UserListSchema`, `SingleUserSchema`, `UserPayloadSchema`, `CreatedUserSchema` with `id: z.string()`,
`UpdatedUserSchema = payload.partial().extend({ updatedAt })`), `auth.schema.ts` (`CredentialsSchema`,
`RegisterSuccessSchema`, `LoginSuccessSchema`); every schema exports its `z.infer` type. Each
endpoint was curl-probed first; a throwaway spec validated all 10 schemas against live reqres (all OK)
and showed a wrong schema failing with `✖ expected string, received undefined → at id`.
`users.spec.ts` now does `SingleUserSchema.parse(await response.json())` → `body` is typed.

**Learned (4.2):** schema = runtime check, `z.infer` = compile-time type, both from one source.
`response.json()` is `any` — TypeScript can't know what a server sends; `parse` is the boundary
where `unknown` data becomes a trusted type. `z.object` ignores unknown keys (reqres's `_meta` ads
don't break us); `z.strictObject` rejects them (used only where "exactly `{}`" is the point).
`.extend()` / `.partial()` build schemas from schemas, like `Partial<T>` for types. zod 4 syntax:
`z.email()`, `z.url()`, `z.iso.datetime()` (v3 was `z.string().email()` …). `parse` throws,
`safeParse` returns `{ success, data | error }`; `z.prettifyError` makes it readable.

**Done 2026-10-16:** step 4.3 — clients. `api/clients/ApiResponse.ts` (`ApiResponse<T>`: `status`,
`body()` validates with the success schema, `bodyAs(schema)` for other shapes, error message =
URL + status + `z.prettifyError` + full body). `BaseClient.ts`: protected generic
`get/post/put/patch<T>(url, schema, options?)` → `Promise<ApiResponse<T>>` via one private `send()`
over `request.fetch`; `delete(url)` → raw `APIResponse`; `RequestOptions = Parameters<APIRequestContext['fetch']>[1]`.
`UsersClient` (`listUsers`, `getUser`, `createUser`, `updateUser`, `patchUser`, `deleteUser`) and
`AuthClient` (`register`, `login`). Throwaway probe: all 10 calls OK against live reqres; wrong schema
→ clear error; `body.data.idd` → `tsc` TS2339. `users.spec.ts` uses `new UsersClient(request)` (temporary).

**Learned (4.3):** generics = a type parameter filled in per call: `get<T>(url, schema: z.ZodType<T>)`
— pass `UserListSchema` and T *becomes* `UserList` (inferred, never written by the caller). One
generic method replaces one hand-typed method per endpoint. `Parameters<F>[1]` borrows a library's
option type instead of copying it. `protected` = usable by subclasses, invisible to tests — so tests
can only call meaningful actions (`getUser(2)`), never raw URLs. A subclass method can't reuse a
parent's name with a different signature (`get(id)` vs `get(url, schema)`) → action names
(`getUser`). zod's default `z.object` *strips* unknown keys from the parsed result (`_meta` gone).

**Done 2026-10-16:** step 4.4 — `api/fixtures/test.ts`: `base.extend<ApiFixtures>` with `usersClient`
and `authClient`, each `new XClient(request)` from the built-in `request` fixture; re-exports `expect`.
`users.spec.ts` imports `test`/`expect` from `../fixtures/test` and asks for `{ usersClient }`.
First run timed out (30s, "Request context disposed"): reqres itself answered in 15.7s on a cold
curl, then 0.3s — external slowness, not our code. 3 reruns green (~1s).

**Learned (4.4):** fixtures compose — custom `usersClient` depends on built-in `request`, which
already has `baseURL` + headers from the project. "Request context disposed" after a timeout is a
*consequence* (Playwright cleaned up), not the cause — read the first error line ("Test timeout")
and check the dependency (curl with timing `-w %{time_total}`) before changing code. Tests against
a public API inherit its outages/cold starts; that's why Phase 4 keeps them few and CI retries exist.

**2026-10-16 — target switch:** probing the 4.5 error cases hit reqres's new limit: **429 after
40 requests/day per IP** (`X-Ratelimit-Limit: 40`, resets midnight UTC). Decision (user): switch to
**dummyjson.com** (no key, ~100 req/min, real JWT login). Config: `baseURL: 'https://dummyjson.com'`,
API-key header removed. Schemas/clients rewritten for dummyjson; the layers (schemas → `ApiResponse<T>`
→ `BaseClient` → clients → fixtures) didn't change — only *what* they describe. `BaseClient.delete<T>`
now takes a schema (dummyjson's DELETE returns the deleted user, reqres returned an empty 204).

**Done 2026-10-16:** step 4.5 — 18 API tests, ~4s. `users.spec.ts` (@users): list page (limit/skip,
unique ids), past-the-end page (`skip = total` read from the API), single user, invalid ids
data-driven (9999 → 404, 'abc' → 400), create (201, `toMatchObject`), PUT, PATCH, DELETE
(`isDeleted` literal, `deletedOn` near now), timeout (`?delay=3000` vs `timeout: 1000` →
`rejects.toThrow(/Timeout 1000ms exceeded/)`). `auth.spec.ts` (@auth): login success (JWT regex in
schema), 4 login errors data-driven, `/auth/me` with a **worker-scoped `accessToken` fixture**,
`/auth/me` without token → 401, invalid token → expects 401, gets **500** → `test.fail()` (verified
by removing it: `Expected 401, Received 500`). `api/test-data/users.ts`: `EMILY`, `NEW_USER`,
`API_ERRORS`. Docs: `API-TESTING.md` §1/§4 rewritten for dummyjson (reqres kept collapsed).

**Learned (4.5):** a good architecture survives a backend switch — only schemas, URLs and data
changed. Write schemas from *probed* responses: `/users/add` returns `email: ''`, so it can't reuse
`UserSchema` (`z.email()` rejects `''`). Worker-scoped fixture = runs once per worker process, shared
by its tests (`[fn, { scope: 'worker' }]`); it can't use test-scoped `request`, so it builds its own
context from `workerInfo.project.use.baseURL` and disposes it after `use()`. Ask the API for facts
that can change (`total`) instead of hard-coding them. `await expect(promise).rejects.toThrow()` for
calls that must fail. `test.fail()` always needs the inverse check (remove it, read the real error).

**Done 2026-10-16:** step 4.6 — exit checks. (1) `UserSchema.id` → `z.string()`: the list test
fails with `Schema validation failed for https://dummyjson.com/users?limit=5&skip=10 (status 200):
✖ Invalid input: expected string, received number → at users[0].id` + full body. `tsc` still passed
(exit 0). Reverted. (2) New endpoint `/users/search?q=`: probe → `searchUsers()` (reuses
`UserListSchema`) → 2 tests (matches contain "john"; "zzzz" → empty, total 0) → green in 22s (Claude's
time — the real criterion is the user's own time; optional exercise below). Full suite 67/67 green.
**Phase 4 done.**

**Learned (4.6):** the broken schema compiled because `expect(x).toBe(y)` accepts any type — types
catch *misuse in code* (`body.data.idd`), only the runtime schema catches *wrong data from the
server*. You need both. A cheap new endpoint = no new schema (same list shape), one client line,
tests copied from an existing pattern — that's what the layers buy.

**Optional exercise (user, ≤15 min):** add `GET /users/filter?key=hair.color&value=Brown` —
`filterUsers(key, value)` in `UsersClient` + a test that every returned user… (hint: `UserSchema`
doesn't include `hair` yet — extend it or add a narrow schema).

**▶ Start here next: Phase 6 (Reporting & data)** — Phase 5 done 2026-10-18 (stress/spike carried over to Phase 7).

  > **Task 1 (recorded 2026-10-14):** other user types.
  > - [x] A — data-driven login for every role except `lockedUser` (`Exclude<Role, 'lockedUser'>`)
  > - [x] B — `authFile(role)`; setup writes one `playwright/.auth/<role>.json` per role
  > - [x] Cleanups (non-blocking): rename `loginRole` → `LoginRole` and use it in `authFile`'s
  >   parameter; merge the two imports in `auth.setup.ts`; setup title `authenticate as ${role}`
  > - [x] C: new `e2e/tests/problem-user.spec.ts` with `test.use({ storageState: authFile('problemUser') })`;
  >   add an `images` locator to `InventoryPage`; collect each `src`; assert no duplicates
  >   (`new Set(srcs).size` vs length) → mark `test.fail()` with a comment why. Try it once as
  >   `standardUser` to see it pass there
  > - [x] Run chromium + firefox (43 green) — commit pending, plus a "why" comment above `test.fail()`

  > **Task 2 (recorded 2026-10-16):** data-driven checkout step-one errors.
  > - [x] `checkout.spec.ts`: replace the one sequential test (fill → clear → fill…) with a
  >   `CheckoutErrorCase` type (`title`, `info: Partial<CheckoutInfo>`, `error`) + array of 3 cases
  >   + `for` loop inside `test.describe` → 3 independent tests with unique titles
  > - [x] Each test starts on a fresh step-one page; decide whether items in the cart are needed
  >   to test form validation (hint: `checkoutPage.goto()`)
  > - [x] Assert the error, then that you're still on step one; no `.clear()` calls needed
  > - [x] Run chromium + firefox (47 green) — commit pending user review
- [x] order math in cents with tax rate (subtotal + tax = total, no float errors)
- [x] partial: add-to-cart button text, cart prices + badge after remove
Optional: `webkit` / mobile web project; JSON API mocking on `demo.playwright.dev/api-mocking`
(`E2E-TESTING.md` §5.4); `@typescript-eslint/no-floating-promises`.

---

## Phase 0 — Environment & TypeScript Foundations ✅

**Deliverable:** configured repo. `npm run typecheck` and `npm run lint` work and fail loudly on bad
code.

Steps (done — kept here as a reference if you ever set up a new project):

1. `npm init -y`, `git init`, `.gitignore`
2. `npm i -D typescript @types/node` → `npx tsc --init`
3. `tsconfig.json` with **strict mode on** from day one
4. `npm i -D eslint @eslint/js typescript-eslint prettier eslint-config-prettier` → `eslint.config.mjs`
5. Scripts: `lint`, `lint:fix`, `typecheck`
6. **Remaining fix:** ESLint must ignore generated output. In `eslint.config.mjs` change the
   ignores block to:
   ```js
   {
     ignores: ["node_modules/**", "dist/**", "coverage/**",
               "playwright-report/**", "test-results/**", "blob-report/**",
               "allure-results/**", "allure-report/**", "performance/k6/results/**"],
   },
   ```
   Then `npm run lint` should show only warnings from your own files.
7. Optional but recommended: add a `.prettierrc` so formatting is consistent:
   ```json
   { "semi": false, "singleQuote": true, "printWidth": 100, "tabWidth": 2 }
   ```
   and a script `"format": "prettier --write ."` (add a `.prettierignore` with the same generated
   folders as above).

**TypeScript focus:** `tsconfig.json` options, what `strict` turns on, `any` vs `unknown`. See
`TYPESCRIPT-NOTES.md` → Phase 0.

**Exit criteria:** you can explain what 3 different `strict` sub-flags do without looking them up.

---

## Phase 1 — Playwright E2E Fundamentals ✅

**Deliverable:** Playwright installed, `playwright.config.ts` written by hand, one working test
against saucedemo (login happy path).

Done. Things worth re-practising if they feel shaky:
- `npx playwright test --headed` (watch it run), `npx playwright test --ui` (UI mode),
  `npx playwright show-report`, `npx playwright show-trace test-results/<folder>/trace.zip`
- `npx playwright codegen https://www.saucedemo.com` — records clicks and prints locators. Use it to
  *discover* locators, never paste its output as your final test.
- Exit-criteria exercise: break the test on purpose (e.g. expect `/inventory2.html`), run with
  `--trace on`, open the trace and find the failing step in the timeline.

---

## Phase 2 — Page Object Model & E2E Architecture ✅

**Deliverable:** `e2e/pages/` with at least 4 page objects (Login, Inventory, Cart, Checkout) and a
`BasePage`; a typed test-data module; a custom fixture file that injects page objects and a
logged-in state.

Step-by-step (details + reference code in `E2E-TESTING.md` → "Phase 2 walkthrough"):

1. **Test data:** finish `e2e/test-data/users.ts` — a literal union / `as const` object for usernames,
   a `User` type, and `export` it. (Step 2.1)
2. **BasePage:** make `page` `protected readonly`, add a `path` contract and a `goto()` that uses it.
   Remove the unused `Locator` import. (Step 2.2)
3. **LoginPage:** readonly locators (`usernameInput`, `passwordInput`, `loginButton`,
   `errorMessage`) + action `login(username, password)`. (Step 2.3)
4. **Refactor `login.spec.ts`** to use `LoginPage` — the test must contain zero `getByTestId` calls.
5. **InventoryPage, CartPage, CheckoutPage** (decide: one class or three — see `ARCHITECTURE.md`).
   (Step 2.4)
6. **Header component:** the cart icon + burger menu appear on every logged-in page → make a small
   `HeaderComponent` class that page objects *contain* (composition) rather than inherit. (Step 2.5)
7. **Fixtures:** `e2e/fixtures/test.ts` exporting a `test` built with `test.extend<Fixtures>()` that
   provides `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage`, and a `loggedInPage`-style
   fixture. All specs import `test`/`expect` from this file from now on. (Step 2.6)
8. **Record decisions** in `ARCHITECTURE.md` (type vs interface, file naming, fixture scope).

**TypeScript focus:** classes (`private`/`protected`/`public`, `readonly`, `abstract`), interfaces
as contracts, generics in `test.extend<Fixtures>()`, literal union types for user names.

**Exit criteria:** adding a 5th page object (e.g. `ProductDetailsPage`) takes you under 10 minutes
because the pattern is obvious from the existing ones.

---

## Phase 3 — Advanced E2E Patterns

**Deliverable:** 12–20 tests covering login (all user types + invalid/empty creds), inventory
sorting, cart, checkout (incl. total math), at least one network-interception test, tags, and two
browser projects (chromium + firefox).

Step-by-step (details in `E2E-TESTING.md` → "Phase 3 walkthrough"):

1. Write the full scenario list from `E2E-TESTING.md` using your page objects.
2. **Data-driven tests:** loop over an array of cases to generate one `test()` per case (e.g. the
   4 login error messages).
3. **Auth via `storageState`:** a `setup` project that logs in once and saves cookies to
   `playwright/.auth/standard.json`; other tests reuse it (much faster than UI login each time).

   > **Task (recorded 2026-10-09):** replace the per-test UI login (`beforeEach` / `loggedIn`
   > fixture from Phase 2) with `storageState`.
   > - [x] `e2e/tests/auth.setup.ts`: log in with `LoginPage.loginAs('standardUser')`, wait for
   >   `/inventory.html`, then `await page.context().storageState({ path: 'playwright/.auth/standard.json' })`
   > - [x] `playwright.config.ts`: add a `setup` project (`testMatch: /.*\.setup\.ts/`); E2E projects
   >   get `dependencies: ['setup']` and `use: { storageState: 'playwright/.auth/standard.json' }`
   > - [x] Add `playwright/.auth/` to `.gitignore` (it holds a session cookie)
   > - [x] `login.spec.ts` must start logged out: `test.use({ storageState: { cookies: [], origins: [] } })`
   > - [x] Other roles (`problemUser`, …): one state file per role (`authFile(role)`, Task 1 part B)
   > - [x] Remove the now-redundant login from `beforeEach` / `loggedIn`; tests start with
   >   `inventoryPage.goto()`
   > - [ ] Compare suite runtime before/after
4. **Network interception** with `page.route` (block images, delay resources, fake a 500).
5. **Tags:** `test('...', { tag: '@smoke' }, ...)` and run with `--grep @smoke`.
6. **Cross-browser:** add `firefox` (and optionally `webkit`) to `projects`.
7. **Retries & flakiness:** set `retries: process.env.CI ? 2 : 0`; run the suite with
   `--repeat-each=5` to shake out flaky tests; fix root causes, never add `waitForTimeout`.

**TypeScript focus:** discriminated unions, utility types (`Partial`, `Pick`, `Omit`), type
guards/narrowing, `satisfies`.

**Exit criteria:** `npx playwright test --project=chromium --project=firefox --repeat-each=5` is fully green (E2E only — reqres rate-limits repeated API runs), and for any flaky test you
hit you can explain the actual race condition.

---

## Phase 4 — API Testing

**Deliverable:** `api/` suite against dummyjson.com (reqres.in until 2026-10-16) covering list/get/create/update/delete/login/me
plus response schema validation with `zod`, using Playwright's `request` fixture (no browser).

Step-by-step (details in `API-TESTING.md`):

1. `npm i -D zod`
2. Add an `api` project to `playwright.config.ts` (own `testDir`, `baseURL`, headers).
3. Write `api/schemas/user.schema.ts` (zod) → infer types with `z.infer`.
4. Write `api/clients/BaseClient.ts` (generic `get<T>`/`post<T>` that validate with a schema) and
   `api/clients/UsersClient.ts`.
5. Write `api/fixtures/test.ts` that provides `usersClient`.
6. Write the tests from the checklist in `API-TESTING.md`.
7. Add `"test:api": "playwright test --project=api"` and change `test:e2e` to run only E2E projects.

**TypeScript focus:** generics (`get<T>(...)`), `z.infer<typeof schema>`, mapped types.

**Exit criteria:** adding a new endpoint test takes under 15 minutes, and a deliberately wrong
schema (e.g. `id: z.string()`) fails with a clear zod error message.

---

## Phase 5 — Performance Testing with k6

**Deliverable:** `performance/k6/` with smoke, load, stress and spike scripts in TypeScript (stress/spike moved to Phase 7 (2026-10-18: no Docker locally; GitHub runners have it)), against
**a target built for load testing only** (QuickPizza / test.k6.io / your own local server — see
`PERFORMANCE-TESTING.md`).

Step-by-step (details in `PERFORMANCE-TESTING.md`):

1. Install k6 (Windows: `winget install k6 --source winget`), check `k6 version` (need ≥ 1.0 for
   built-in TypeScript).
2. `npm i -D @types/k6` for editor autocompletion.
3. Smoke script → run → read the summary.
4. Load script with stages + thresholds → then stress → then spike.
5. Export results (`--summary-export` / `handleSummary`).
6. npm scripts `perf:smoke`, `perf:load`, …

**TypeScript focus:** type-checking vs runtime — k6 strips your types and never checks them.

**Exit criteria:** you can explain what a specific failed threshold means about the system and at
which stage of the ramp it failed.

---

## Phase 6 — Reporting & Test Data Management

**Deliverable:** HTML report (+ optionally Allure) for E2E+API; k6 JSON/HTML summaries; a shared
`@faker-js/faker`-based data factory used by both E2E (checkout form) and API (create user).

Step-by-step:

1. `npm i -D @faker-js/faker`
2. `shared/test-data/factories.ts` — `makeCheckoutInfo(overrides?: Partial<CheckoutInfo>)` and
   `makeUserPayload(overrides?)`. Reference in `TYPESCRIPT-NOTES.md` → Phase 6.
3. Use them in the checkout E2E test and the API create test.
4. Reporter config: `reporter: [['list'], ['html', { open: 'never' }]]`; in CI also
   `['github']` and `['junit', { outputFile: 'results/junit.xml' }]`.
5. `test.step('...', async () => {...})` inside page-object methods so the report reads like
   prose.
6. Optional Allure: `npm i -D allure-playwright allure` (Allure 3 — pure Node; the older
   `allure-commandline` is Allure 2 and needs Java), add
   `['allure-playwright', { resultsDir: 'allure-results' }]` to reporters, then
   `npm run report:allure` (`allure generate allure-results --clean -o allure-report`) and
   `npm run report:allure:open`. allure-playwright never deletes old results → a `globalSetup`
   clears `allure-results/` before each run.
7. Attach useful data on failure: `await testInfo.attach('response', { body, contentType: 'application/json' })`.

**TypeScript focus:** typed factories, `Partial<T>` overrides.

**Exit criteria:** a failed test's report alone (no re-running) tells you exactly what broke.

---

## Phase 7 — CI/CD

**Deliverable:** GitHub Actions workflow(s) running lint+typecheck+E2E+API on every push/PR, k6 as a
manual/scheduled job, reports uploaded as artifacts. Full reference YAML in `CI-CD.md`.

**Carried over from Phase 5:** write `stress.ts` + `spike.ts` (PERFORMANCE-TESTING.md steps 5.4/5.5) and run
them in the k6 job against QuickPizza as a service container (`BASE_URL=http://localhost:3333`) — never
against the public demo. Document what broke first and at what VU count; whether latency recovered after the spike.

**Exit criteria:** a fresh clone with only `npm ci` passes CI green.

---

## Phase 8 — Native Mobile (Appium + WebdriverIO)

**Deliverable:** `mobile/` suite with its own `wdio.conf.ts` that runs TypeScript tests against the
**WebdriverIO Native Demo App** on a local Android emulator: login/sign-up forms, form controls,
swipe, drag and drop, and a WebView screen. Page objects + test data follow the same conventions
as `e2e/`.

**Why these tools:** Appium is the industry standard for black-box mobile automation (it tests an
installed APK, no app source needed). WebdriverIO is its TypeScript test runner — `async`/`await`,
`expect`, page objects — so POM/fixture habits from Phase 2 carry over. Detox needs the app's source,
Maestro tests are YAML (no TypeScript), Espresso/XCUITest are Kotlin/Swift. **Android only on
Windows** — iOS automation needs a Mac with Xcode.

**App under test:**
- Primary: [WebdriverIO Native Demo App](https://github.com/webdriverio/native-demo-app) — maintained,
  built for exactly this stack. Download the Android `.apk` from its GitHub Releases.
- Optional second app: [Sauce Labs My Demo App (React Native)](https://github.com/saucelabs/my-demo-app-rn/releases)
  — the mobile saucedemo (catalog, sort, cart, checkout). Repo archived May 2024 (latest v1.3.0):
  check it runs on your emulator before investing in it.
- Never commit the `.apk` (binary, large) — add `mobile/apps/` to `.gitignore` and document the
  download in the README (or a small download script).

Step-by-step:

1. **Machine setup** (expect this to take a day — it's the hardest part):
   - Java JDK 17+ → set `JAVA_HOME`
   - Android Studio → SDK Manager: a recent Android SDK + platform-tools; Device Manager: create a
     Pixel emulator. Set `ANDROID_HOME` and add `platform-tools` to `PATH`
   - Hardware virtualization enabled in BIOS; 16 GB RAM recommended
   - Check: emulator boots, `adb devices` lists it
   - Record every error + fix in `TROUBLESHOOTING.md` → Mobile
2. **Appium:** `npm i -D appium` → `npx appium driver install uiautomator2` →
   `npx appium driver doctor uiautomator2` must show no required fixes.
   Optional: Appium Inspector (desktop app) to inspect the app's element tree — mobile's codegen.
3. **WebdriverIO project:** `npm init wdio@latest ./mobile` → choose: Mobile testing (Appium),
   Android, Mocha, TypeScript. Keep `mobile/` self-contained (own `wdio.conf.ts`, own `tsconfig.json`
   with `@wdio/globals/types`) so it doesn't clash with Playwright's types.
4. **Capabilities** in `wdio.conf.ts`: `platformName: 'Android'`,
   `'appium:automationName': 'UiAutomator2'`, `'appium:app'`: absolute path to the `.apk`,
   `'appium:deviceName'`. First test: app launches and the home screen is visible.
5. **Locators:** accessibility ID first (`$('~button-login-container')`), then UiAutomator selectors,
   XPath last. Find IDs with Appium Inspector. Why accessibility IDs: stable, fast, and the same
   attribute serves screen readers.
6. **Page objects:** `mobile/pages/` — `BaseScreen` (shared helpers like `waitForDisplayed`), `LoginScreen`,
   `FormsScreen`, `SwipeScreen`, `DragScreen`, `WebviewScreen`; a `TabBar` component (composition,
   like `HeaderComponent`).
7. **Tests** (`mobile/tests/*.spec.ts`):
   - login: valid + invalid email/password validation messages (data-driven, like Phase 3)
   - sign up: password mismatch error, success dialog
   - forms: type text, toggle switch, pick from dropdown, assert values
   - swipe: swipe the carousel until a specific card is visible
   - drag and drop: complete the puzzle, assert the success message
   - WebView: switch context (`driver.getContexts()` / `driver.switchContext(...)`), assert web
     content, switch back to `NATIVE_APP`
8. **App state:** reset the app between tests (`driver.terminateApp` / `activateApp`, or
   `'appium:noReset': false`) — explain the speed vs isolation trade-off in `ARCHITECTURE.md`.
9. **Reporting:** spec reporter locally; screenshot on failure in an `afterTest` hook;
   optional Allure (same as Phase 6).
10. **npm scripts:** `"test:mobile": "wdio run mobile/wdio.conf.ts"` (start the emulator first).
11. **Optional CI:** a separate, manually triggered GitHub Actions job using an Android emulator
    action (e.g. `reactivecircus/android-emulator-runner`). Slow and heavier than browser jobs — keep
    it out of the per-push pipeline.
12. **Optional:** run the same suite on a cloud device (BrowserStack / Sauce Labs free trial) by
    swapping capabilities only — proves your page objects aren't tied to one device.

**TypeScript focus:** typing WebdriverIO capabilities (`WebdriverIO.Capabilities`), a generic
`BaseScreen` helper, sharing a `type` between screens, separate `tsconfig.json` per runner and why
global types (`$`, `driver`, `browser`) need explicit configuration.

**Exit criteria:** `npm run test:mobile` is green twice in a row on a fresh emulator; adding a new
screen object takes under 15 minutes; you can explain native vs WebView context and why a swipe
test can be flaky (animation timing) and how you made it stable without fixed sleeps.

---

## Stretch Ideas (pick 0–2)

- Visual regression — `await expect(page).toHaveScreenshot()`; first run creates baselines, update
  with `--update-snapshots`. Baselines are OS-specific (Windows vs Linux CI differ) — generate them
  in CI or in Docker.
- Accessibility — `npm i -D @axe-core/playwright`;
  `const results = await new AxeBuilder({ page }).analyze(); expect(results.violations).toEqual([])`
- Dockerize — use the official image `mcr.microsoft.com/playwright:v1.63.0-noble` (match your
  installed Playwright version).
- Contract testing concepts (Pact) against the API layer.
- Mutation testing (Stryker) of the API client layer.

---

## Final "Portfolio Ready" Checklist

- [ ] README explains what the project is, how to run each suite, and shows the CI badge
- [ ] `npm ci && npx playwright install && npm test` works on a fresh clone
- [ ] All conventions in `ARCHITECTURE.md` filled in with a *why*
- [ ] Every box in `TYPESCRIPT-NOTES.md` ticked with a file reference
- [ ] No `waitForTimeout`, no `any`, no `@ts-ignore` without a comment
- [ ] Commit history tells the story phase by phase (small, meaningful commits)
