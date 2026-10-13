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

## Current Status (as of 2026-10-12, end of day)

| Phase | Status | Notes |
|---|---|---|
| 0 — Environment | ✅ done | `playwright-report/` is ignored and lint passes. Optional: also ignore `test-results/`, `blob-report/` and the Allure folders (step 6) |
| 1 — Playwright fundamentals | ✅ done | |
| 2 — POM & architecture | ✅ done | 7 page objects + `HeaderComponent`, typed test data, fixtures incl. `loggedIn`; login/inventory/cart/checkout specs green; `ARCHITECTURE.md` Phase 1–2 rows filled |
| 3 — Advanced E2E | 🟡 in progress | Steps 1–4 done (scenario list, data-driven login, `storageState`, network interception). Next: step 5 tags. See "Phase 3 — next session" below |
| 4 — API | ⬜ | `api/` folder exists, empty |
| 5 — k6 | ⬜ | `performance/` folder exists, empty; k6 not installed yet |
| 6 — Reporting & data | ⬜ | |
| 7 — CI/CD | ⬜ | |
| 8 — Native mobile (Appium + WebdriverIO) | ⬜ | Android only (Windows); app: WebdriverIO Native Demo App |

Update this table as you go — it's your progress log.

### Phase 3 — next session (updated 2026-10-14)

**State:** typecheck + lint clean, 15 tests green (1 setup + 14 chromium), ~7.5s.
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

**▶ Start here next session: step 5 — tags (`@smoke`).** Optional extra for step 4: the JSON API
mocking exercise on `demo.playwright.dev/api-mocking` (`E2E-TESTING.md` §5.4).

**Then (Phase 3 order):** step 5 tags (`@smoke`) →
step 6 Firefox (+ optional mobile web projects) → step 7 retries + `--repeat-each=5`.
Partial scenarios to finish along the way: add-to-cart button text, cart prices + badge after
remove, data-driven checkout errors, order math in cents with tax rate.

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
   > - [ ] Other roles (`problemUser`, …): one state file per role, or keep UI login for those specs
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
