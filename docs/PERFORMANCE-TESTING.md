# Performance Testing Plan (k6)

## Important: Target Selection

**Only ever load-test `https://test.k6.io`** (and its sub-paths, e.g. `/contacts.php`,
`/pi.php`), plus anything you personally stand up locally (e.g. a `json-server` mock).

Do **not** point k6 load/stress/spike tests at saucedemo.com, reqres.in, or any other third-party
site you don't own or that hasn't explicitly opted in — sending sustained concurrent traffic at a
site without authorization can look like (or functionally be) a denial-of-service, regardless of
intent, and likely violates its terms of service. `test.k6.io` is built and maintained by the
Grafana k6 team specifically to absorb load-test traffic from people learning the tool — it's the
correct and only appropriate default target here. Single, occasional, low-volume smoke checks
(1 VU, a handful of requests) against a public API for *functional* API tests (Phase 4) are a
different, much lower-impact thing than the sustained/ramping traffic k6 load tests generate — the
line to hold is specifically around k6's load/stress/spike scenarios.

If you later want to performance-test something closer to a "real app," stand up a local server
(the Phase-context "tiny sample app" idea, or a tool like `json-server`) and point k6 at
`localhost`.

## k6 + TypeScript

k6 runs scripts in its own JS runtime (Goja), not Node — it does not execute TypeScript directly.
Options, pick one and document the choice in `ARCHITECTURE.md`:
1. Write `.ts`, transpile with `esbuild` (or `webpack` via `k6-bundler` style setups) to plain JS
   before running `k6 run`.
2. Write plain `.js` for k6 scripts only, keep TypeScript everywhere else in the repo.

Either is legitimate — (1) keeps TS consistency and is a good exercise in understanding
build/execution separation; (2) is simpler and honest about k6's actual runtime. Given the goal is
mastering TypeScript, (1) is the better learning choice, but budget extra time for the tooling
setup itself being a small project.

## Test Types to Build

1. **Smoke test** — 1 virtual user (VU), a handful of iterations, verifies the script itself works
   and the target responds correctly. Run this before every other test type.
2. **Load test** — ramp to an expected normal concurrency (e.g., 10–20 VUs) over a set duration,
   hold, ramp down. Verify thresholds hold under expected load.
3. **Stress test** — ramp well beyond expected load to find where thresholds start failing —
   the point is to *find* the breaking point, not to avoid it.
4. **Spike test** — sudden jump to a high VU count for a short period, then back down — checks
   recovery behavior, not just peak handling.

## Structure

```
performance/
└── k6/
    ├── scenarios/
    │   ├── smoke.ts
    │   ├── load.ts
    │   ├── stress.ts
    │   └── spike.ts
    └── scripts/
        └── (shared request/check helpers)
```

## What to Assert

- Use `check()` for functional correctness during load (e.g., status 200, expected field present)
  — a load test that never checks responses can "pass" while silently getting garbage back.
- Use `thresholds` in `options` for pass/fail on performance itself (e.g., `http_req_duration:
  ['p(95)<500']`, `http_req_failed: ['rate<0.01']`). A build should fail CI if thresholds fail.

## Checklist

- [ ] k6 binary installed locally, `k6 version` works
- [ ] TS-to-JS build step decided and documented
- [ ] Smoke test passing against test.k6.io
- [ ] Load test with at least 2 thresholds
- [ ] Stress test that actually finds a breaking point (document what broke and at what VU count)
- [ ] Spike test with a recovery-time observation
- [ ] Results exported (JSON and/or HTML summary) — see `CI-CD.md` for wiring into CI later
