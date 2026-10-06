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

## Current Status (as of 2026-10-06)

| Phase | Status | Notes |
|---|---|---|
| 0 — Environment | ✅ done | `playwright-report/` is ignored and lint passes. Optional: also ignore `test-results/`, `blob-report/` and the Allure folders (step 6) |
| 1 — Playwright fundamentals | ✅ done | |
| 2 — POM & architecture | 🟡 in progress | Steps 2.1–2.3 done (test data, `BasePage`, `LoginPage`, `login.spec.ts` uses the fixture). Pages for 2.4 are created but mostly empty; `HeaderComponent`, `money.ts` and fixtures are partly done. See "Phase 2 — next session" below |
| 3 — Advanced E2E | ⬜ | |
| 4 — API | ⬜ | `api/` folder exists, empty |
| 5 — k6 | ⬜ | `performance/` folder exists, empty; k6 not installed yet |
| 6 — Reporting & data | ⬜ | |
| 7 — CI/CD | ⬜ | |

Update this table as you go — it's your progress log.

### Phase 2 — next session (recorded 2026-10-06)

Nothing below is committed yet. Commit first.

**Fix first:**
- [ ] Move `addToCartButton` out of `BasePage`. Not every page has it, and on the inventory page it matches 6 buttons (strict mode violation). Put it on `InventoryPage` per product and on `ProductDetails`.
- [ ] Remove the redeclared `readonly page: Page` + `this.page = page` from `CartPage`, `CheckoutPage`, `CheckoutOverviewPage`, `InventoryPage` and `ProductDetails`. It makes `page` public; `BasePage` already provides it as `protected`.
- [ ] `HeaderComponent`: change `constructor(readonly page: Page)` to `constructor(page: Page)` so `page` isn't a public field.
- [ ] `ProductDetails`: `path = '..'` should be `'/inventory-item.html'`. Override `expectLoaded()` with a URL regex (`?id=N`) and wait for the back button. Consider renaming it to `ProductDetailsPage`.
- [ ] `InventoryPage`: `path` should be `protected readonly`. Remove the unused `Locator` import (lint warning).
- [ ] Rename the folder `e2e/pages/componenets/` to `components/` and update the imports.

**Still to build:**
- [ ] `HeaderComponent`: add `cartBadge` (optionally `resetAppStateLink`)
- [ ] `InventoryPage`: items, names, prices, sort dropdown; `addToCart(name)`, `removeFromCart(name)`, `sortBy(option)`, `getNames()`, `getPrices()`, `openDetails(name)`
- [ ] `ProductDetails`: name, price, add/remove buttons
- [ ] `CartPage`: `header`, items/names/prices, `remove(name)`, `checkout()`
- [ ] `CheckoutPage` (step one): `errorMessage`, `fillInfo(info: Partial<...>)`, `continue()`
- [ ] `CheckoutOverviewPage`: item names, subtotal/tax/total labels, `getSummary()` (uses `parsePrice`), `finish()`
- [ ] `CheckoutCompletePage`: new file; complete header and back-home button
- [ ] Fixtures: `inventoryPage`, `productDetailsPage`, `checkoutCompletePage`, a `user` option (`Role`, default `'standardUser'`), and `loggedIn`
- [ ] A spec that uses the new pages (add item → badge → cart → checkout → complete)
- [ ] `ARCHITECTURE.md`: fill in decisions (checkout split into 3 classes, `type` vs `interface`, file naming, fixture scope)

**Suggested order:** fixes, then `cartBadge`, then `InventoryPage` + `CartPage` + a first cart spec, then the checkout pages, then the `loggedIn` fixture.

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

## Phase 2 — Page Object Model & E2E Architecture 🟡

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

**Deliverable:** `api/` suite against reqres.in covering list/get/create/update/delete/register/login
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

**Deliverable:** `performance/k6/` with smoke, load, stress and spike scripts in TypeScript, against
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
6. Optional Allure: `npm i -D allure-playwright allure-commandline`, add
   `['allure-playwright']` to reporters, `npx allure generate allure-results --clean -o allure-report`
   then `npx allure open allure-report`.
7. Attach useful data on failure: `await testInfo.attach('response', { body, contentType: 'application/json' })`.

**TypeScript focus:** typed factories, `Partial<T>` overrides.

**Exit criteria:** a failed test's report alone (no re-running) tells you exactly what broke.

---

## Phase 7 — CI/CD

**Deliverable:** GitHub Actions workflow(s) running lint+typecheck+E2E+API on every push/PR, k6 as a
manual/scheduled job, reports uploaded as artifacts. Full reference YAML in `CI-CD.md`.

**Exit criteria:** a fresh clone with only `npm ci` passes CI green.

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
