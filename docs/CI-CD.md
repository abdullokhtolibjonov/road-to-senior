# CI/CD Plan (GitHub Actions)

Phase 7 — do this once E2E, API, and k6 all work reliably locally. CI is where hidden local-machine
assumptions get exposed (absolute paths, global installs, "works on my machine" env vars) — expect
some friction and treat it as part of the learning, not a distraction from it.

## Jobs

| Job | Trigger | Notes |
|---|---|---|
| `lint-and-typecheck` | every push/PR | fastest job, fail fast before running anything else |
| `e2e` | every push/PR | needs `npx playwright install --with-deps` step; cache browsers |
| `api` | every push/PR | fast, no browser needed |
| `k6` | `workflow_dispatch` + optional nightly `schedule` | not on every push — slower, noisier, and only ever targets test.k6.io per `PERFORMANCE-TESTING.md` |

## Things to Get Right

- **Caching:** `node_modules` (via `actions/setup-node`'s built-in cache) and the Playwright
  browser binaries cache (separate step/key, browsers are large and slow to reinstall every run).
- **Artifacts:** upload Playwright HTML report + traces on failure, and k6's JSON/HTML summary, as
  workflow artifacts (`actions/upload-artifact`) so a failure is debuggable from the Actions UI
  without re-running locally.
- **Secrets:** none expected for public demo targets — if you add dummyjson.com auth or anything
  needing a token, use repo secrets, never commit them.
- **Matrix (optional):** browser matrix (`chromium`, `firefox`) for the `e2e` job once single-browser
  CI is solid.

## Checklist

- [ ] `lint-and-typecheck` job green on a clean PR
- [ ] `e2e` job green, with browser install caching working (check run time drops on 2nd run)
- [ ] `api` job green
- [ ] `k6` job runs manually via `workflow_dispatch` and produces a downloadable summary artifact
- [ ] Failing test in a PR produces a report artifact that actually helps diagnose without pulling
      the branch locally
- [ ] (Stretch) status badge in `README.md`
