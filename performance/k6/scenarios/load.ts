import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { DEFAULT_THRESHOLDS } from '../config.ts'
import { getHome, postPizza } from '../lib/requests.ts'

// Load: ramp up to the expected number of users, hold, ramp down.
// Answers "does the system meet our thresholds under normal traffic?"
// 10 VUs × 2 min stays well inside the public QuickPizza limits (docs/PERFORMANCE-TESTING.md §1).
export const options: Options = {
    stages: [
        { duration: '30s', target: 10 }, // ramp up: gradual, so a failure points to load, not a cold start
        { duration: '1m', target: 10 }, // hold: the steady state the thresholds really judge
        { duration: '30s', target: 0 }, // ramp down
    ],
    thresholds: {
        ...DEFAULT_THRESHOLDS,
        // Per-endpoint budget via the `name` tag from lib/requests.ts. Pizza generation does real
        // work server-side, so it gets a looser p95 than the global 800ms.
        'http_req_duration{name:pizza}': ['p(95)<1200'],
    },
}

export default function (): void {
    getHome()
    sleep(1)
    postPizza()
    sleep(1)
}
