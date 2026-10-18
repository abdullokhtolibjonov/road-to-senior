// Override per run: k6 run -e BASE_URL=http://localhost:3333 <script>
// Default is Grafana's public demo; keep runs against it small (see docs/PERFORMANCE-TESTING.md §1).
export const BASE_URL: string = __ENV.BASE_URL ?? 'https://quickpizza.grafana.com'

// Shared pass/fail criteria. A broken threshold makes k6 exit non-zero, which fails CI.
export const DEFAULT_THRESHOLDS = {
    http_req_failed: ['rate<0.01'], // < 1 % failed requests
    http_req_duration: ['p(95)<800', 'p(99)<1500'], // ms
    checks: ['rate>0.99'],
}
