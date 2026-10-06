# Troubleshooting, Cheat Sheet & Self-Help

Your "no-AI" survival kit: how to debug on your own, the errors you're most likely to hit in this
project (with fixes), a command cheat sheet, and where to find authoritative answers.

---

## 1. A debugging routine that works without help

1. **Read the first error completely**, including file:line. Later errors are often consequences.
2. **Reproduce with the smallest run:** one file, one test —
   `npx playwright test e2e/tests/login.spec.ts:12 --project=chromium`.
3. **Look, don't guess:**
   - E2E: `--headed`, `--debug` (step through with the Inspector), `--ui`, or `--trace on` then
     `npx playwright show-report` → click the test → Trace.
   - TypeScript: hover the variable in VS Code; read the full error (the last lines of a long TS
     error usually say what's actually incompatible).
   - API: `console.log(await res.text())` or `curl.exe` the same request.
4. **Change one thing at a time**, re-run.
5. **Search the exact error text** (in quotes) + "playwright"/"typescript". Prefer results from
   the official docs and GitHub issues of the tool.
6. **Write it down**: add the error + fix to the table below — future you will hit it again.

---

## 2. Known errors & fixes

### TypeScript

| Error | Cause | Fix |
|---|---|---|
| `Cannot find name 'process'` (TS2591) | your `tsconfig.json` has `"types": []`, so Node's globals aren't loaded | set `"types": ["node"]` (`@types/node` is already installed) |
| `Relative import paths need explicit file extensions...` (TS2835) | `module: nodenext` | write `'./LoginPage.ts'`, not `'./LoginPage'` |
| `'Page' is a type and must be imported using a type-only import...` (TS1484) | `verbatimModuleSyntax` | `import type { Page } from '@playwright/test'` or `import { expect, type Page } ...` |
| `Object is possibly 'undefined'` (TS2532) on `arr[0]` / `match[1]` | `noUncheckedIndexedAccess` | handle it: `const x = arr[0]; if (!x) throw new Error(...)` or `arr[0]?.foo` |
| `Type 'undefined' is not assignable ... with 'exactOptionalPropertyTypes: true'` (TS2375/TS2379) | you passed `{ key: undefined }` to an optional property | omit the key instead, or declare `key?: string \| undefined` |
| `Property 'x' has no initializer and is not definitely assigned in the constructor` (TS2564) | `strictPropertyInitialization` | assign it in the constructor (or initialise at declaration) |
| `This member must have an 'override' modifier...` | `noImplicitOverride` is on | add `override` to the subclass method |
| `Cannot find name '__ENV'` in k6 scripts | k6 types not loaded | `npm i -D @types/k6` + `performance/k6/tsconfig.json` with `"types": ["k6"]` (see PERFORMANCE-TESTING.md §2) |
| Typecheck passes but editor shows red (or vice versa) | VS Code uses a different TS version | Ctrl+Shift+P → "TypeScript: Select TypeScript Version" → "Use Workspace Version" |

### ESLint

| Error | Cause | Fix |
|---|---|---|
| Thousands of errors in `playwright-report/trace/assets/*.js` | ESLint lints generated folders | add `playwright-report/**`, `test-results/**`, `blob-report/**` to `ignores` in `eslint.config.mjs` |
| `Unexpected empty object pattern` (no-empty-pattern) in fixtures | `async ({}, use) =>` | destructure a real fixture, or `// eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring` |
| `'X' is defined but never used` | leftover import/variable | delete it (or prefix with `_` if intentionally unused and you configure that) |

### Playwright

| Error | Cause | Fix |
|---|---|---|
| `Executable doesn't exist at ...ms-playwright...` | browsers not installed (or Playwright upgraded) | `npx playwright install` (or `npx playwright install firefox`) |
| `strict mode violation: getByTestId('x') resolved to 6 elements` | locator matches several elements and you acted on it | narrow it: `.filter({ hasText: 'Backpack' })`, `.first()` only if order truly doesn't matter |
| `Test timeout of 30000ms exceeded` / `waiting for getByTestId(...)` | element never appeared: wrong locator, wrong page, or not logged in | open the trace, look at the DOM snapshot at that step; check the URL |
| `expect(...).toHaveURL` fails with `.../inventory.html?` or trailing `/` | exact string match | use a regex: `toHaveURL(/inventory\.html/)` |
| `No tests found` | wrong `testDir`/`testMatch`, or `--project` filter | check `playwright.config.ts`; `npx playwright test --list` shows what it sees |
| `Playwright Test did not expect test() to be called here` | two copies of `@playwright/test` installed, or `test()` called inside another test / at import time of a non-spec file | `npm ls @playwright/test`; make sure only spec files call `test()` |
| `First argument must use the object destructuring pattern` | fixture written as `async (fixtures, use)` | write `async ({ page }, use)` |
| `Fixture "x" has unknown parameter "y"` | fixture depends on a fixture not declared in the `extend<...>` types/object | add it, or check spelling |
| No trace/video after a failure | `trace: 'on-first-retry'` with `retries: 0` | use `'retain-on-failure'` or run with `--trace on` |
| Tests pass headed, fail headless (or vice versa) | timing / viewport | never add sleeps; assert on a state (`toBeVisible`, `toHaveURL`) before the next action |
| Logged-in tests suddenly land on login page | storageState file is stale (saucedemo session expired) | the `setup` project regenerates it each run — make sure projects have `dependencies: ['setup']` |

### API / network

| Error | Cause | Fix |
|---|---|---|
| reqres returns `401 {"error":"Missing API key"}` | missing header | `extraHTTPHeaders: { 'x-api-key': 'reqres-free-v1' }` in the `api` project (check reqres.in for the current key) |
| reqres returns `429` in random tests | free-tier rate limit (too many requests, e.g. `--repeat-each`) | wait a few minutes; don't repeat API tests; run them once per CI job |
| `SyntaxError: Unexpected end of JSON input` from `res.json()` | body is empty (e.g. 204) or HTML | assert status first; use `res.text()` for non-JSON |
| zod: `Invalid input: expected number, received string` at `id` | real API type differs from your schema | decide which is right; update the schema (that's the schema doing its job) |

### k6

| Error | Cause | Fix |
|---|---|---|
| `k6 : The term 'k6' is not recognized` | not installed or terminal opened before install | open a new terminal; `winget install k6 --source winget` |
| `The moduleSpecifier "../config" couldn't be found` | k6 needs file extensions | `import ... from '../config.ts'` |
| TS syntax error when running a `.ts` file | k6 older than 1.0 | upgrade k6 (`winget upgrade k6`) |
| Exit code 99 | a threshold failed | expected behavior — read which threshold in the summary (✗ mark) |
| `connection refused` to `localhost:3333` | local QuickPizza not running | start the Docker container (see PERFORMANCE-TESTING.md §1) |

### Windows / Git / npm

| Error | Cause | Fix |
|---|---|---|
| `npx.ps1 cannot be loaded because running scripts is disabled` | PowerShell execution policy | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (once) |
| `LF will be replaced by CRLF` warnings | Windows line endings | add a `.gitattributes` with `* text=auto eol=lf` and commit it |
| `npm ci` fails: lock file out of sync | `package.json` changed without `npm install` | run `npm install`, commit `package-lock.json` |
| Works locally, fails in CI with "Cannot find module './loginPage.ts'" | case-sensitive file system on Linux | match the file name's exact casing in imports |

---

## 3. Command cheat sheet

```bash
# Quality gates
npm run typecheck
npm run lint            # npm run lint:fix to auto-fix
npx prettier --write .  # if you add Prettier formatting

# Playwright — running
npx playwright test                                 # everything
npx playwright test --project=chromium              # one project
npx playwright test e2e/tests/login.spec.ts         # one file
npx playwright test login.spec.ts:12                # one test by line
npx playwright test -g "locked out"                 # by title text
npx playwright test --grep @smoke                   # by tag
npx playwright test --last-failed                   # rerun failures
npx playwright test --repeat-each=5 --workers=4     # flakiness hunt
npx playwright test --list                          # show what would run

# Playwright — debugging
npx playwright test --headed
npx playwright test --debug                         # Inspector, step through
npx playwright test --ui                            # UI mode (watch + time travel)
npx playwright test --trace on
npx playwright show-report
npx playwright show-trace test-results/<dir>/trace.zip
npx playwright codegen https://www.saucedemo.com    # record to discover locators

# Playwright — maintenance
npx playwright install                              # browsers
npx playwright install --with-deps chromium         # + OS deps (Linux/CI)
npm i -D @playwright/test@latest && npx playwright install   # upgrade

# k6
k6 version
k6 run performance/k6/scenarios/smoke.ts
k6 run -e BASE_URL=http://localhost:3333 performance/k6/scenarios/load.ts
k6 run --summary-export=performance/k6/results/s.json <script>
# PowerShell: HTML dashboard report
$env:K6_WEB_DASHBOARD='true'; $env:K6_WEB_DASHBOARD_EXPORT='performance/k6/results/report.html'; k6 run <script>

# Git habits
git status
git add -p                      # review each change before staging
git commit -m "Phase 2: add LoginPage and fixtures"
git log --oneline -10
```

---

## 4. Authoritative resources

| Topic | Where |
|---|---|
| Playwright docs (everything) | https://playwright.dev/docs/intro |
| Locators / best practices | https://playwright.dev/docs/locators · https://playwright.dev/docs/best-practices |
| Page Object Model | https://playwright.dev/docs/pom |
| Fixtures | https://playwright.dev/docs/test-fixtures |
| Auth / storageState | https://playwright.dev/docs/auth |
| API testing | https://playwright.dev/docs/api-testing |
| Network mocking | https://playwright.dev/docs/mock · https://playwright.dev/docs/network |
| Config reference | https://playwright.dev/docs/test-configuration |
| CI | https://playwright.dev/docs/ci-intro |
| Assertions list | https://playwright.dev/docs/test-assertions |
| TypeScript handbook | https://www.typescriptlang.org/docs/handbook/intro.html |
| TSConfig reference (every option explained) | https://www.typescriptlang.org/tsconfig |
| TS Playground | https://www.typescriptlang.org/play |
| zod | https://zod.dev |
| faker | https://fakerjs.dev/api/ |
| k6 docs | https://grafana.com/docs/k6/latest/ |
| k6 TypeScript | https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/ |
| k6 thresholds / test types | https://grafana.com/docs/k6/latest/using-k6/thresholds/ · https://grafana.com/docs/k6/latest/testing-guides/test-types/ |
| QuickPizza (k6 demo app) | https://github.com/grafana/quickpizza |
| GitHub Actions | https://docs.github.com/en/actions |
| Playwright source/issues (search errors) | https://github.com/microsoft/playwright/issues |

Books/courses if you want depth later: *Effective TypeScript* (Dan Vanderkam), the free
"TypeScript Deep Dive" (basarat.gitbook.io/typescript), Playwright's YouTube channel.
