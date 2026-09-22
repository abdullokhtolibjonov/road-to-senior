# Roadmap

A phased curriculum. Each phase has a **deliverable** (what exists at the end), a **TypeScript
focus** (new language concepts you should deliberately use, not just stumble into), and
**exit criteria** (how you know you're actually done, not just "it ran once").

Don't skip ahead when bored — the later phases assume the earlier ones are solid, especially the
TypeScript config and POM foundations. Do feel free to re-order Phase 4 (API) before Phase 2/3
(advanced E2E) if you want more variety.

---

## Phase 0 — Environment & TypeScript Foundations

**Deliverable:** empty-but-configured repo. `npm run typecheck` and `npm run lint` work and fail
loudly on bad code.

- Node + npm project init, git init, `.gitignore`
- `tsconfig.json` with **strict mode on** from day one (don't start loose and tighten later — you
  won't)
- ESLint + Prettier, with the TypeScript ESLint plugin
- Decide package manager and stick with it

**TypeScript focus:** `tsconfig.json` options (`strict`, `target`, `module`, `esModuleInterop`,
`skipLibCheck`), what "strict mode" actually turns on (`noImplicitAny`, `strictNullChecks`, etc.),
basic types vs `any` vs `unknown`.

**Exit criteria:** you can explain what 3 different `strict` sub-flags do without looking them up.

---

## Phase 1 — Playwright E2E Fundamentals

**Deliverable:** Playwright installed, `playwright.config.ts` written by hand (not left as
generated boilerplate — read every option you keep), one working test file against saucedemo
(login flow, happy path only).

- Install `@playwright/test`
- Understand test runner concepts: `test`, `describe`, `expect`, `beforeEach`/`afterEach`
- Locator strategies (`getByRole`, `getByTestId`, `getByText`) vs raw CSS/XPath — prefer
  role/testid
- Run headed vs headless, use the trace viewer and UI mode

**TypeScript focus:** function type annotations, `async`/`await` typing, what Playwright's own
types give you for free (hover a `Page` object and read its type), interfaces vs type aliases
(pick one convention and note *why* in `ARCHITECTURE.md`).

**Exit criteria:** one passing test, one deliberately broken test where you read the trace to find
the failure (don't just fix blind).

---

## Phase 2 — Page Object Model & E2E Architecture

**Deliverable:** `e2e/pages/` with at least 3 page objects (Login, Inventory, Cart/Checkout) and a
base page class; a custom fixture that injects logged-in state.

- Page Object Model: one class per page, locators as readonly class fields, action methods
- A `BasePage` with shared behavior (navigation, common waits)
- Playwright fixtures (`test.extend`) — e.g., an `authenticatedPage` fixture that logs in once per
  test instead of repeating login steps
- Externalize test data (saucedemo's known users: `standard_user`, `locked_out_user`,
  `problem_user`, `performance_glitch_user`) into a typed config, not magic strings scattered
  around

**TypeScript focus:** classes (constructors, `private`/`protected`/`public`, `readonly`),
interfaces to define a page object's public contract, generics in `test.extend<Fixtures>()`,
enums or literal union types for the user types instead of raw strings.

**Exit criteria:** adding a 4th page object takes you under 10 minutes because the pattern is
obvious from the existing 3.

---

## Phase 3 — Advanced E2E Patterns

**Deliverable:** 8–12 tests covering login (all 4 user types + invalid creds), inventory sorting,
cart, and checkout, with at least one test using network mocking/interception and one using
multiple browser projects (chromium + firefox at minimum).

- Network interception (`page.route`) to mock a response and test an edge case saucedemo can't
  normally produce (e.g., a simulated API error)
- Test tagging/grouping (`@smoke`, `@regression`) and running subsets via CLI grep
- Retries and understanding *why* a test is flaky before adding a retry (don't paper over root
  causes)
- Cross-browser config in `playwright.config.ts` (`projects` array)

**TypeScript focus:** discriminated unions (e.g., modeling different mocked API response shapes),
utility types (`Partial`, `Pick`, `Omit`) for building test data variants, type guards/narrowing.

**Exit criteria:** you can explain, for one real flaky test you hit, what the actual race condition
was — not "I added a `waitForTimeout` and it went away."

---

## Phase 4 — API Testing

**Deliverable:** `api/` suite against reqres.in covering CRUD-shaped flows (list users, get user,
create, update, delete) plus response schema validation, using Playwright's `request` context
(no browser).

- A typed API client wrapper (methods return typed responses, not raw `any` JSON)
- Schema validation with `zod` (recommended for a TS project — schemas double as inferred types)
  or `ajv`
- Status code + body assertions separated clearly from schema assertions
- If you do the dummyjson.com stretch: a login flow that stores a token and reuses it via a
  fixture, similar to the E2E `authenticatedPage` fixture

**TypeScript focus:** generics for a reusable typed client (`get<T>(url): Promise<T>`), mapped
types, `zod`'s `z.infer<typeof schema>` pattern (schema-first typing — the type comes from runtime
validation, not the other way around).

**Exit criteria:** you can add a new endpoint test in under 15 minutes reusing the client, and a
deliberately malformed mock response fails schema validation with a clear error.

---

## Phase 5 — Performance Testing with k6

**Deliverable:** `performance/k6/` with a smoke test, a load test, and a spike test against
**test.k6.io only** (see `PERFORMANCE-TESTING.md` for why this matters — never point load tests at
saucedemo/reqres or any site you don't own).

- k6 installed as a binary (not an npm package — k6 runs its own JS runtime, this trips people up)
- Understand k6 script structure: `default function`, `options` (stages, thresholds), `check()`
- Load profile types: smoke (1 VU, verify script works), load (expected traffic), stress (find
  breaking point), spike (sudden burst)
- Thresholds as pass/fail criteria (e.g., `p(95)<500`), not just eyeballing a report

**TypeScript focus:** k6's TS support runs through a bundler (`webpack`/`babel` loader or the
`k6/x/...` extension approach, or simplest: write `.ts` and transpile with `esbuild` before running
— document whichever you pick and why in `ARCHITECTURE.md`); this is a good forcing function to
understand the difference between *type-checking* (design time) and *what actually executes*
(runtime JS) — k6 never sees your types.

**Exit criteria:** you can explain, for your load test, what specific threshold failing would mean
about the system, and what stage of the ramp it would fail at.

---

## Phase 6 — Reporting & Test Data Management

**Deliverable:** Playwright HTML report and/or Allure wired up for E2E+API; k6 results exported to
JSON/HTML; a shared `faker`-based test data generator used by at least E2E and API suites.

- Playwright's built-in HTML reporter configured properly (traces on retry, screenshots on
  failure)
- Optional: Allure reporter if you want cross-suite unified reporting
- `@faker-js/faker` for generating test data (e.g., random user payloads for API create tests)
  instead of hardcoded strings

**TypeScript focus:** typing faker-based factory functions (`function makeUser(): UserPayload`),
keeping test data factories composable (`Partial<UserPayload>` overrides).

**Exit criteria:** a failed test's report alone (no re-running) tells you exactly what broke.

---

## Phase 7 — CI/CD

**Deliverable:** GitHub Actions workflow(s) running lint+typecheck+E2E+API on every push/PR, with
k6 as a separate manually-triggered or scheduled job, and reports published as artifacts.

- Separate jobs: `lint-and-typecheck`, `e2e`, `api`, `k6` (k6 likely `workflow_dispatch` or
  scheduled, not on every push, since perf tests are slower and noisier)
- Caching `node_modules`/Playwright browsers to keep CI fast
- Upload test reports/traces as workflow artifacts
- (Stretch) a status badge in `README.md`

**TypeScript focus:** none new — this phase is about making the whole thing reproducible in a
clean environment, which will surface any TS config assumptions that only worked "on your
machine."

**Exit criteria:** a fresh clone of the repo, with no local setup beyond `npm ci`, passes CI green.

---

## Stretch Ideas (pick 0–2, don't do all of them)

- Visual regression testing (Playwright's `toHaveScreenshot`)
- Accessibility checks (`@axe-core/playwright`)
- Contract testing concepts against the API layer
- Dockerizing the whole suite
- Mutation testing your API client layer to check test quality (e.g., Stryker)
