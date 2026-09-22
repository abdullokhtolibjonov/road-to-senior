# Road to Senior — Playwright + TypeScript Test Automation

A personal test-automation portfolio project built to master **TypeScript** through practical,
progressively harder test-engineering work: **E2E tests** (Playwright), **API tests** (Playwright
request context), and **performance tests** (k6).

This is a learning project, not a production framework — but it is built like one. Every phase
adds a real capability and a deliberate TypeScript skill on top of the last.

## Goals

1. Get fluent in TypeScript by using it for something real, not tutorials in isolation.
2. Build a Playwright E2E suite with proper architecture (Page Object Model, fixtures, config).
3. Build an API test suite with a typed API client layer.
4. Build k6 performance tests and understand how they relate to (and differ from) functional tests.
5. Wire it all into CI (GitHub Actions) with reporting.

## Systems Under Test (SUT)

To keep 100% focus on tooling/TypeScript (no backend to build/maintain), tests run against public
practice targets:

| Test type   | Target                          | Why |
|-------------|----------------------------------|-----|
| E2E         | https://www.saucedemo.com        | Stable, purpose-built for UI test practice; login, inventory, cart, checkout flows; multiple user types (standard/locked/problem/performance_glitch) for varied scenarios |
| API         | https://reqres.in (primary), https://dummyjson.com (stretch, real CRUD + auth) | Predictable REST endpoints, good for CRUD + schema validation practice |
| Performance | https://test.k6.io                | **Built by the Grafana k6 team specifically for load-testing practice.** Never load-test saucedemo/reqres or other third-party sites you don't own — see `PERFORMANCE-TESTING.md` |

## Repository Structure (target end-state)

This is the structure the project grows into over the phases — see `ROADMAP.md` for the order.

```
road-to-senior/
├── e2e/
│   ├── fixtures/
│   ├── pages/              # Page Object classes
│   ├── tests/
│   └── test-data/
├── api/
│   ├── clients/            # typed API client wrappers
│   ├── schemas/            # zod/ajv schemas for response validation
│   ├── tests/
│   └── test-data/
├── performance/
│   └── k6/
│       ├── scenarios/
│       └── scripts/
├── shared/
│   ├── config/             # env config, typed
│   └── utils/
├── .github/workflows/
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── docs/ (this planning set)
```

## Docs Map

All planning docs live in `docs/` to keep the repo root clean once source folders fill in.

- `docs/ROADMAP.md` — the phased curriculum: what to build, in what order, and what TS/testing
  concept each phase is meant to teach.
- `docs/ARCHITECTURE.md` — conventions: naming, config strategy, how layers relate, what "done"
  looks like for each layer.
- `docs/TYPESCRIPT-NOTES.md` — running checklist of TypeScript concepts mapped to the phase that
  introduces them, plus beginner-friendly explanations of *why* each concept matters for testing.
- `docs/E2E-TESTING.md` — Playwright E2E plan: POM design, fixtures, selectors strategy, saucedemo
  test scenarios to implement.
- `docs/API-TESTING.md` — API test plan: client design, schema validation, auth, test data.
- `docs/PERFORMANCE-TESTING.md` — k6 plan: scenario types, thresholds, TypeScript-in-k6 caveats,
  and the load-testing ethics note (only ever test targets you own or that are meant for this).
- `docs/CI-CD.md` — GitHub Actions plan: jobs, triggers, artifacts, reporting.

## Ground Rule

You write all the code yourself. These docs define *what* to build and *why*, in order, so that
each step teaches something specific — they are not a spec to copy-paste, and there's no code in
this repo written by the assistant.
