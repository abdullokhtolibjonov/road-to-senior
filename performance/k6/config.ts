// Override per run: k6 run -e BASE_URL=http://localhost:3333 <script>
// Default is Grafana's public demo; keep runs against it small (see docs/PERFORMANCE-TESTING.md §1).
export const BASE_URL: string = __ENV.BASE_URL ?? 'https://quickpizza.grafana.com'

// Stress and spike overload the target on purpose: never against the shared public demo.
// Call at the top of the script (init context) so k6 stops before sending a single request.
export function assertLocalTarget(): void {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(BASE_URL)) {
        throw new Error(`Refusing to overload ${BASE_URL}: run with -e BASE_URL=http://localhost:3333`)
    }
}

// Shared pass/fail criteria. A broken threshold makes k6 exit non-zero, which fails CI.
export const DEFAULT_THRESHOLDS = {
    http_req_failed: ['rate<0.01'], // < 1 % failed requests
    http_req_duration: ['p(95)<800', 'p(99)<1500'], // ms
    checks: ['rate>0.99'],
}
