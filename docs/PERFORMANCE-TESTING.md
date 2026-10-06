# Performance Testing Plan (k6) — Phase 5

k6 is a load-testing tool written in Go. You write the test script in JS/TS; k6 runs it with many
**virtual users (VUs)** in parallel and measures response times, error rates, etc.

> **Rule for reference solutions:** try first, then open the `<details>` block, then type it
> yourself.

---

## 1. Target selection (read this first)

Only load-test targets that are **built for it** or that **you own**:

| Target | Use for | Notes |
|---|---|---|
| **Local QuickPizza** (Docker): `docker run --rm -it -p 3333:3333 ghcr.io/grafana/quickpizza-local:latest` → `http://localhost:3333` | **all** test types, especially stress & spike | Best option: no limits, no ethics concerns, results not affected by internet |
| `https://quickpizza.grafana.com` | smoke + small load tests | Grafana's current public demo app for k6 examples. Keep public runs modest (≲ 50 VUs, a few minutes) |
| `https://test.k6.io` | smoke + small load tests | Grafana's older demo site. It may be retired/replaced by QuickPizza — if it's down, use QuickPizza |
| A `json-server` or any server you run on `localhost` | anything | `npx json-server db.json` |

**Never** point load/stress/spike tests at saucedemo.com, reqres.in, dummyjson.com or any other site
you don't own. Sustained concurrent traffic against a site that didn't opt in can act like a
denial-of-service attack and violates their terms, whatever your intent. One-off functional API
calls (Phase 4) are fine; k6 load profiles are not.

QuickPizza endpoints useful for scripts (verify in the browser / its GitHub README):
- `GET /` — home page (HTML)
- `POST /api/pizza` with header `Authorization: token abcdef0123456789` and JSON body
  `{ "maxCaloriesPerSlice": 1000, "mustBeVegetarian": false, "excludedIngredients": [], "excludedTools": [], "maxNumberOfToppings": 5, "minNumberOfToppings": 2 }`
  → returns `{ pizza: { name, dough, ingredients, tools, ... }, calories, vegetarian }`
  (the token is a public demo token from k6's docs; any 16-char token usually works)

---

## 2. Install & setup

1. Install k6 (it is a **binary**, not an npm package):
   ```powershell
   winget install k6 --source winget
   # or: choco install k6
   # or: download the .msi from https://github.com/grafana/k6/releases
   ```
   Open a **new** terminal, then `k6 version`. You need **v1.0 or newer**.
2. Editor types (autocomplete + typecheck; k6 itself never reads them):
   ```bash
   npm i -D @types/k6
   ```
3. Give k6 its own tsconfig, because k6 scripts run in k6's runtime (not Node) and use k6 globals
   like `__ENV` and `__VU`:
   ```jsonc
   // performance/k6/tsconfig.json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": { "types": ["k6"] },
     "include": ["./**/*.ts"],
     "exclude": []   // must reset: the root's "exclude" (below) would otherwise be inherited
   }
   ```
   In the **root** `tsconfig.json` add `"exclude": ["node_modules", "performance"]` and change
   the typecheck script to check both:
   ```json
   "typecheck": "tsc --noEmit && tsc --noEmit -p performance/k6"
   ```
4. Results folder: `performance/k6/results/` is already git-ignored.

### k6 + TypeScript (how it works now)

Since k6 **v1.0**, `k6 run script.ts` works directly: k6 strips the types with a built-in esbuild
step and runs the remaining JavaScript. So:
- No webpack/esbuild setup needed (older guides that tell you to bundle are outdated).
- Types are checked **only** by `npm run typecheck` / your editor — k6 itself never checks them. A
  wrong `as SomeType` still blows up at runtime. This is the Phase 5 TypeScript lesson.
- Local imports need the file extension: `import { checkOk } from '../lib/checks.ts'`.
- You can't use npm packages that depend on Node APIs (`fs`, `path`, …) — k6 is not Node.

---

## 3. Concepts you need

### Script anatomy

```ts
import http from 'k6/http'
import { check, sleep } from 'k6'
import type { Options } from 'k6/options'

export const options: Options = { /* VUs, duration/stages, thresholds */ }

export function setup() { /* runs once before the test; return value passed to default() */ }

export default function () {
  // runs repeatedly by every VU = one "iteration"
}

export function teardown() { /* runs once at the end */ }
```

### Key built-in metrics (shown in the end-of-test summary)

| Metric | Meaning |
|---|---|
| `http_req_duration` | total time of the request (send + wait + receive). Main latency metric |
| `http_req_waiting` | time to first byte (server think time) |
| `http_req_failed` | rate of failed requests (by default: status ≥ 400 or network error) |
| `checks` | rate of passed `check()` conditions |
| `iterations` / `iteration_duration` | how many times `default()` ran, and how long each took |
| `vus` / `vus_max` | active virtual users |

**Percentiles:** `p(95)=420ms` means 95 % of requests were faster than 420 ms. Use p(95)/p(99),
not averages — averages hide slow outliers.

### `check()` vs `thresholds`

- `check(res, { 'status is 200': r => r.status === 200 })` — a *functional* assertion per response.
  A failed check does **not** fail the test by itself; it's counted in the `checks` metric.
- `thresholds` — *pass/fail criteria* for the whole run. If any threshold fails, k6 exits with
  code **99** → CI job fails. Always add `checks: ['rate>0.99']` so failed checks can fail the run.

### Load profile types

| Type | Shape | Question it answers |
|---|---|---|
| Smoke | 1 VU, few iterations | Does the script work? Is the system up? (run before everything else) |
| Load | ramp to expected users, hold, ramp down | Does it meet the thresholds under normal load? |
| Stress | ramp in steps well above normal | Where does it start breaking (which VU count)? |
| Spike | sudden jump to high VUs, short hold, drop | Does it survive a burst and **recover** afterwards? |
| Soak (optional) | normal load for a long time (30 min+) | Memory leaks / degradation over time — local only |

### `sleep()` = think time

Real users pause between actions. Without `sleep(1)` each VU hammers the server in a tight loop,
which makes "10 VUs" mean far more traffic than 10 humans.

---

## 4. Target structure

```
performance/k6/
├── tsconfig.json
├── config.ts               # BASE_URL from __ENV, shared thresholds
├── lib/
│   └── requests.ts         # getHome(), postPizza() + their checks
├── scenarios/
│   ├── smoke.ts
│   ├── load.ts
│   ├── stress.ts
│   └── spike.ts
└── results/                # git-ignored
```

npm scripts (package.json):
```json
"perf:smoke": "k6 run performance/k6/scenarios/smoke.ts",
"perf:load": "k6 run performance/k6/scenarios/load.ts",
"perf:stress": "k6 run performance/k6/scenarios/stress.ts",
"perf:spike": "k6 run performance/k6/scenarios/spike.ts"
```
Run against local QuickPizza: `k6 run -e BASE_URL=http://localhost:3333 performance/k6/scenarios/load.ts`.

---

## 5. Step-by-step

### Step 5.1 — Shared config and request helpers

<details>
<summary>Reference solution</summary>

```ts
// performance/k6/config.ts
export const BASE_URL: string = __ENV.BASE_URL ?? 'https://quickpizza.grafana.com'

export const DEFAULT_THRESHOLDS = {
  http_req_failed: ['rate<0.01'],             // < 1 % errors
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  checks: ['rate>0.99'],
}
```

```ts
// performance/k6/lib/requests.ts
import http from 'k6/http'
import { check } from 'k6'
import { BASE_URL } from '../config.ts'

interface PizzaResponse {
  pizza: { name: string; ingredients: unknown[] }
  calories: number
}

export function getHome(): void {
  const res = http.get(`${BASE_URL}/`, { tags: { name: 'home' } })
  check(res, {
    'home: status 200': (r) => r.status === 200,
  })
}

export function postPizza(): void {
  const body = JSON.stringify({
    maxCaloriesPerSlice: 1000,
    mustBeVegetarian: false,
    excludedIngredients: [],
    excludedTools: [],
    maxNumberOfToppings: 5,
    minNumberOfToppings: 2,
  })
  const res = http.post(`${BASE_URL}/api/pizza`, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'token abcdef0123456789',
    },
    tags: { name: 'pizza' },
  })
  check(res, {
    'pizza: status 200': (r) => r.status === 200,
    'pizza: has a name': (r) => {
      // r.json() returns an untyped JSON value; `as` is a claim k6 will NOT verify at runtime
      const data = r.json() as unknown as PizzaResponse
      return typeof data?.pizza?.name === 'string' && data.pizza.name.length > 0
    },
  })
}
```
`tags: { name: 'home' }` lets you set thresholds per endpoint:
`'http_req_duration{name:pizza}': ['p(95)<1200']`.
</details>

### Step 5.2 — Smoke test

1 VU, a few iterations. Run it before every other test type.

<details>
<summary>Reference solution</summary>

```ts
// performance/k6/scenarios/smoke.ts
import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { DEFAULT_THRESHOLDS } from '../config.ts'
import { getHome, postPizza } from '../lib/requests.ts'

export const options: Options = {
  vus: 1,
  iterations: 5,
  thresholds: DEFAULT_THRESHOLDS,
}

export default function (): void {
  getHome()
  postPizza()
  sleep(1)
}
```
Run: `npm run perf:smoke`. Read the summary: all checks ✓, `http_req_failed` 0 %.
</details>

### Step 5.3 — Load test

Ramp up → hold at expected load → ramp down.

<details>
<summary>Reference solution</summary>

```ts
// performance/k6/scenarios/load.ts
import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { DEFAULT_THRESHOLDS } from '../config.ts'
import { getHome, postPizza } from '../lib/requests.ts'

export const options: Options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up to 10 VUs
    { duration: '1m', target: 10 },    // hold
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    'http_req_duration{name:pizza}': ['p(95)<1200'],
  },
}

export default function (): void {
  getHome()
  sleep(1)
  postPizza()
  sleep(1)
}
```
</details>

### Step 5.4 — Stress test (local target!)

Increase load in steps until thresholds start failing; `abortOnFail` stops the run once the system
is clearly broken, so you know roughly at which step it happened.

<details>
<summary>Reference solution</summary>

```ts
// performance/k6/scenarios/stress.ts
import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { getHome, postPizza } from '../lib/requests.ts'

export const options: Options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '10s' }],
    http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: true, delayAbortEval: '10s' }],
  },
}

export default function (): void {
  getHome()
  postPizza()
  sleep(1)
}
```
Run: `k6 run -e BASE_URL=http://localhost:3333 performance/k6/scenarios/stress.ts`.
Write down in `ARCHITECTURE.md` / a results note: *at which VU level* p95 or error rate crossed
the line, and what the first symptom was (latency rising vs errors appearing).
</details>

### Step 5.5 — Spike test (local target!)

<details>
<summary>Reference solution</summary>

```ts
// performance/k6/scenarios/spike.ts
import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { getHome } from '../lib/requests.ts'

export const options: Options = {
  stages: [
    { duration: '30s', target: 5 },     // baseline
    { duration: '10s', target: 150 },   // spike
    { duration: '30s', target: 150 },   // hold the spike
    { duration: '10s', target: 5 },     // drop back
    { duration: '1m', target: 5 },      // recovery window — are response times back to baseline?
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
  },
}

export default function (): void {
  getHome()
  sleep(1)
}
```
Recovery observation: compare latency in the baseline vs the recovery window — easiest in the web
dashboard (next step), which shows latency over time.
</details>

### Step 5.6 — Export results

| Output | How |
|---|---|
| End-of-test summary as JSON | `k6 run --summary-export=performance/k6/results/load-summary.json performance/k6/scenarios/load.ts` |
| Every data point (big) | `k6 run --out json=performance/k6/results/raw.json ...` |
| Live dashboard in the browser + HTML report | PowerShell: `$env:K6_WEB_DASHBOARD='true'; $env:K6_WEB_DASHBOARD_EXPORT='performance/k6/results/load-report.html'; k6 run performance/k6/scenarios/load.ts` (dashboard at http://localhost:5665 while running) |
| Custom files | export a `handleSummary(data)` function returning `{ 'path.json': JSON.stringify(data) }`. Note: defining it **replaces** the console summary unless you also return a `stdout` entry |

---

## 6. Checklist

- [ ] k6 ≥ 1.0 installed, `k6 version` works
- [ ] `@types/k6` + `performance/k6/tsconfig.json`; `npm run typecheck` covers k6 scripts
- [ ] Smoke test passing
- [ ] Load test with at least 2 thresholds (incl. `checks`) and one per-endpoint threshold
- [ ] Stress test (local) — documented: what broke first and at what VU count
- [ ] Spike test (local) — documented: did latency return to baseline, how fast
- [ ] JSON summary + HTML dashboard report exported to `performance/k6/results/`
- [ ] Deliberately set an impossible threshold (`p(95)<1`) and confirm k6 exits with code 99
      (`echo $LASTEXITCODE` in PowerShell) — that's what makes CI fail

## 7. Decisions to record in `ARCHITECTURE.md`

- TypeScript run natively by k6 ≥ 1.0 (no bundler); types via `@types/k6` + separate tsconfig.
- Targets: QuickPizza public for smoke/load, local QuickPizza for stress/spike.
