# Architecture & Conventions

This file is a living record of *decisions*, not a spec to implement upfront. Fill in the
"Decision" column as you actually make each call during the relevant phase — the point is to force
you to notice you made a choice and write down why, so you don't re-litigate it three files later.

## Layering

```
tests  →  page objects / API clients  →  Playwright / k6 primitives
              ↑
         shared config & test data
```

- Tests should never call `page.locator(...)` or raw `fetch`/`request` directly — only through a
  page object (E2E) or API client (API). Tests describe *behavior*, page objects/clients describe
  *how*.
- `shared/config` holds environment-driven config (base URLs, timeouts) — typed, not raw
  `process.env` access scattered around.

## Conventions Log

| Topic | Decision | Why | Phase decided |
|---|---|---|---|
| `type` vs `interface` | *(fill in)* | | Phase 1 |
| Locator strategy | *(fill in)* — prefer `getByRole`/`getByTestId` over CSS? | | Phase 1 |
| File naming | *(fill in)* — `*.spec.ts` vs `*.test.ts`, `PascalCase` page objects? | | Phase 2 |
| Fixture scope | *(fill in)* — per-test vs per-worker fixtures, and when each applies | | Phase 2 |
| API client shape | *(fill in)* — one client class per resource? one generic client + endpoint modules? | | Phase 4 |
| Schema validation lib | *(fill in)* — zod vs ajv, and why | | Phase 4 |
| k6-in-TypeScript build step | *(fill in)* — esbuild/webpack loader, how it's invoked | | Phase 5 |
| Test data strategy | *(fill in)* — static fixtures vs faker-generated, and when each applies | | Phase 6 |
| Reporter(s) | *(fill in)* — Playwright HTML only, or + Allure | | Phase 6 |

## Environment Config Strategy

Decide once (Phase 0/1) and note here:
- How base URLs differ per test type (E2E target vs API target vs k6 target) — likely 3 separate
  env vars, not one shared "BASE_URL"
- `.env` file + a typed loader (e.g., a small `config.ts` that reads `process.env` once and
  exports a typed object) vs relying on Playwright's built-in `use.baseURL` per project
- What differs between "local run" and "CI run" (if anything)

## Definition of Done (per phase)

Borrowed from `ROADMAP.md`'s exit criteria, but the general bar for *any* phase:
1. `npm run typecheck` passes with no `any` you can't justify out loud.
2. `npm run lint` passes.
3. Tests pass twice in a row locally (catches obvious flakiness immediately).
4. You can explain every line you wrote — if you pasted something you don't understand, that's
   not done yet, that's a TODO.
