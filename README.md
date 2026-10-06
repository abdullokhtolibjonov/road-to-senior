# Road to Senior — Playwright + TypeScript Test Automation

A personal test-automation portfolio project built to master **TypeScript** through practical,
progressively harder test-engineering work: **E2E tests** (Playwright), **API tests** (Playwright
request context), and **performance tests** (k6).

This is a learning project, not a production framework — but it is built like one. Every phase
adds a real capability and a deliberate TypeScript skill on top of the last.

**Current progress:** see the status table at the top of [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Goals

1. Get fluent in TypeScript by using it for something real, not tutorials in isolation.
2. Build a Playwright E2E suite with proper architecture (Page Object Model, fixtures, config).
3. Build an API test suite with a typed API client layer and schema validation.
4. Build k6 performance tests and understand how they relate to (and differ from) functional tests.
5. Wire it all into CI (GitHub Actions) with reporting.

## Systems Under Test (SUT)

Tests run against public practice targets, so all focus stays on tooling and TypeScript:

| Test type | Target | Why |
|---|---|---|
| E2E | https://www.saucedemo.com | Purpose-built for UI test practice: login, inventory, cart, checkout; several user types with baked-in bugs |
| API | https://reqres.in (primary, needs `x-api-key` header), https://dummyjson.com (stretch: JWT auth) | Predictable REST endpoints for CRUD + schema validation |
| Performance | QuickPizza — https://quickpizza.grafana.com or locally via Docker (test.k6.io as fallback) | Built by the Grafana k6 team for load-testing practice. **Never** load-test saucedemo/reqres/dummyjson — see [`docs/PERFORMANCE-TESTING.md`](docs/PERFORMANCE-TESTING.md) |

## Quick Start

Prerequisites: Node.js 20+ (project uses 24), Git. For Phase 5: k6 ≥ 1.0 (and Docker for the local
target).

```bash
npm ci                         # install exact dependencies
npx playwright install         # download browsers
npm run typecheck
npm run lint
npm run test:e2e               # Playwright E2E
npm run test:e2e:ui            # same, in UI mode
npx playwright show-report     # open the last HTML report
```

Scripts added in later phases: `test:api`, `test:smoke`, `perf:smoke`, `perf:load`, … (defined
in the phase docs).

## Repository Structure (target end-state)

```
road-to-senior/
├── e2e/
│   ├── fixtures/           # test.extend — page objects & logged-in state
│   ├── pages/              # Page Object classes (+ components/)
│   ├── test-data/          # typed constants: users, products, messages
│   ├── utils/              # small helpers (money parsing, ...)
│   └── tests/              # *.spec.ts, auth.setup.ts
├── api/
│   ├── clients/            # typed API client wrappers
│   ├── schemas/            # zod schemas (types inferred from them)
│   ├── fixtures/
│   ├── test-data/
│   └── tests/
├── performance/
│   └── k6/
│       ├── lib/            # shared request + check helpers
│       ├── scenarios/      # smoke / load / stress / spike
│       └── results/        # git-ignored outputs
├── shared/
│   ├── config/             # typed env config
│   └── test-data/          # faker factories used by E2E + API
├── .github/workflows/      # ci.yml, performance.yml
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── package.json
└── docs/
```

## Docs Map

Read them in this order when starting a phase: **ROADMAP → the phase's deep-dive → ARCHITECTURE**.

| Doc | What's inside |
|---|---|
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Progress table, all phases with step-by-step tasks and exit criteria, final checklist |
| [`docs/E2E-TESTING.md`](docs/E2E-TESTING.md) | saucedemo site map, **locator reference**, known texts/prices, Phase 2 POM walkthrough, fixtures, scenario list, Phase 3 patterns (sorting, data-driven, storageState, mocking, tags, flakiness) |
| [`docs/API-TESTING.md`](docs/API-TESTING.md) | reqres endpoints with expected responses, zod schemas, typed client design, fixtures, tests, dummyjson auth stretch |
| [`docs/PERFORMANCE-TESTING.md`](docs/PERFORMANCE-TESTING.md) | target ethics, k6 install on Windows, native TypeScript, metrics explained, smoke/load/stress/spike scripts, result exports |
| [`docs/CI-CD.md`](docs/CI-CD.md) | GitHub Actions basics, full `ci.yml` + `performance.yml`, debugging red runs |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layering rules, conventions log with recommended defaults, env config strategy, definition of done |
| [`docs/TYPESCRIPT-NOTES.md`](docs/TYPESCRIPT-NOTES.md) | TS concept checklist per phase with short explanations and examples |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Debugging routine, known errors → fixes, command cheat sheet, official resources |

## Ground Rule

You write all the code yourself. The docs define *what* to build and *why*, in order, with hints
first. Each step also has a collapsed **reference solution** so the project can be finished
without outside help — use it to check your work or get unstuck after a real attempt, then type
the code yourself and make sure you can explain every line.
