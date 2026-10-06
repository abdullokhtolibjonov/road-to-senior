# CI/CD Plan (GitHub Actions) — Phase 7

Do this once E2E, API, and k6 all work reliably locally. CI is where hidden local-machine
assumptions get exposed (Windows vs Linux paths, globally installed tools, env vars you set once
and forgot) — expect friction and treat it as part of the learning.

---

## 1. How GitHub Actions works (60-second version)

- A **workflow** is a YAML file in `.github/workflows/`. GitHub runs it on **triggers** (`on:`
  push, pull_request, schedule, manual `workflow_dispatch`).
- A workflow has **jobs**; each job runs on a fresh virtual machine (`runs-on: ubuntu-latest`).
  Jobs run in parallel unless you add `needs: other-job`.
- A job has **steps**: either `run:` (a shell command) or `uses:` (a reusable action, e.g.
  `actions/checkout`).
- **Artifacts** are files a job uploads (reports) that you download from the run page.
- **Secrets** (repo → Settings → Secrets and variables → Actions) are injected via
  `${{ secrets.NAME }}` and masked in logs.
- CI runs on **Linux**: file names are case-sensitive (`loginPage.ts` ≠ `LoginPage.ts`) — the #1
  cause of "works on my Windows machine" failures.

---

## 2. Jobs

| Job | Trigger | Notes |
|---|---|---|
| `lint-and-typecheck` | every push/PR | fastest, runs first; others wait for it (`needs`) |
| `api` | every push/PR | no browser install needed |
| `e2e` (matrix: chromium, firefox) | every push/PR | installs only the browser it needs |
| `k6` | manual (`workflow_dispatch`) + weekly `schedule` | separate workflow file; never on every push |

---

## 3. Prerequisites in the repo

Before writing YAML, make sure these work locally from a clean state:

```bash
rm -rf node_modules            # PowerShell: Remove-Item -Recurse -Force node_modules
npm ci                         # installs exactly what's in package-lock.json
npm run lint
npm run typecheck
npx playwright test --project=api
npx playwright test --project=chromium
```

And `playwright.config.ts` has CI-aware settings (see `E2E-TESTING.md` §5.7):
`forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`, a `github` reporter in CI,
`html` reporter with `open: 'never'`.

---

## 4. Reference workflow — `.github/workflows/ci.yml`

Read it line by line; every line is explained in the comments. Check the latest major versions of
the actions on their GitHub pages (e.g. `actions/checkout`) — bump if newer exists.

<details>
<summary>Reference solution</summary>

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

# Cancel an older run of the same branch when a new commit arrives
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm                # caches ~/.npm keyed on package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  api:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx playwright test --project=api
        env:
          REQRES_API_KEY: ${{ secrets.REQRES_API_KEY }}   # optional; config falls back to the free key
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}     # upload even when tests failed
        with:
          name: api-report
          path: playwright-report/
          retention-days: 14

  e2e:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false              # let firefox finish even if chromium fails
      matrix:
        project: [chromium, firefox]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Install Playwright browser + OS dependencies
        run: npx playwright install --with-deps ${{ matrix.project }}
      - run: npx playwright test --project=${{ matrix.project }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: e2e-report-${{ matrix.project }}
          path: |
            playwright-report/
            test-results/
          retention-days: 14
```
</details>

### About caching browsers

The old plan said "cache Playwright browsers". Playwright's own docs **advise against it**:
restoring the cache takes about as long as downloading, and OS dependencies (`--with-deps`) can't
be cached anyway. Caching npm (`cache: npm`) is the part that matters. If you want to experiment
anyway: `actions/cache` on `~/.cache/ms-playwright` keyed on the Playwright version — measure
before/after and write the result in `ARCHITECTURE.md`.

Alternative (no install step at all): run the job inside the official container:
```yaml
    container:
      image: mcr.microsoft.com/playwright:v1.63.0-noble   # must match your @playwright/test version
```

---

## 5. Reference workflow — `.github/workflows/performance.yml`

<details>
<summary>Reference solution</summary>

```yaml
name: Performance

on:
  workflow_dispatch:
    inputs:
      scenario:
        description: Which k6 scenario to run
        type: choice
        options: [smoke, load, stress, spike]
        default: smoke
  schedule:
    - cron: '0 3 * * 1'             # Mondays 03:00 UTC (scheduled runs have no inputs → smoke)

jobs:
  k6:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    services:
      # Local QuickPizza inside the CI VM — safe target for stress/spike
      quickpizza:
        image: ghcr.io/grafana/quickpizza-local:latest
        ports:
          - 3333:3333
    env:
      SCENARIO: ${{ inputs.scenario || 'smoke' }}
    steps:
      - uses: actions/checkout@v5
      - uses: grafana/setup-k6-action@v1
      - name: Run k6
        env:
          BASE_URL: http://localhost:3333
          K6_WEB_DASHBOARD: 'true'
          K6_WEB_DASHBOARD_EXPORT: performance/k6/results/${{ env.SCENARIO }}-report.html
        run: |
          mkdir -p performance/k6/results
          k6 run \
            --summary-export=performance/k6/results/${SCENARIO}-summary.json \
            performance/k6/scenarios/${SCENARIO}.ts
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: k6-${{ env.SCENARIO }}-results
          path: performance/k6/results/
```
k6 exits with code 99 when a threshold fails, which fails the step and the job.
Trigger manually: GitHub → Actions → Performance → "Run workflow".
</details>

---

## 6. Debugging a red CI run

1. Open the run → failing job → expand the red step, read the **first** error (later ones are
   often consequences).
2. Download the report artifact → unzip → `npx playwright show-report <folder>` locally. Traces
   inside it open with `npx playwright show-trace <trace.zip>` (or drag into trace.playwright.dev).
3. Reproduce Linux-like conditions locally: `$env:CI='true'; npx playwright test` (PowerShell) —
   applies your CI-only config branches.
4. Typical causes: case-sensitive import paths, a file you forgot to commit (`git status`),
   something installed globally on your machine but missing from `package.json`, missing
   `--with-deps`, secrets not set.

---

## 7. Checklist

- [ ] `lint-and-typecheck` green on a clean PR
- [ ] `api` job green
- [ ] `e2e` matrix green for chromium and firefox
- [ ] Break a test on purpose in a PR → the uploaded report alone explains the failure
- [ ] `k6` smoke runs via "Run workflow" and uploads a summary + HTML report
- [ ] `forbidOnly` works: a pushed `test.only` fails CI
- [ ] Branch protection (Settings → Branches): require the CI checks before merging to `main`
- [ ] Status badge in `README.md`:
      `![CI](https://github.com/abdullokhtolibjonov/road-to-senior/actions/workflows/ci.yml/badge.svg)`
- [ ] (Stretch) publish the HTML report to GitHub Pages
