import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { assertLocalTarget } from '../config.ts'
import { getHome } from '../lib/requests.ts'
import { type NamedStage, perStageThresholds, tagStage } from '../lib/stages.ts'

// Spike: a sudden burst far above normal, then back. Answers "does it survive the burst, and do
// response times return to baseline afterwards?" Local QuickPizza only.
assertLocalTarget()

const STAGES: readonly NamedStage[] = [
    { name: 'baseline', duration: '30s', target: 5 },
    { name: 'spike-up', duration: '10s', target: 150 },
    { name: 'spike', duration: '30s', target: 150 },
    { name: 'drop', duration: '10s', target: 5 },
    // Recovery: compare its p95 with `baseline` in the summary — close = recovered.
    { name: 'recovery', duration: '1m', target: 5 },
    { name: 'ramp-down', duration: '10s', target: 0 },
]

export const options: Options = {
    stages: STAGES.map(({ duration, target }) => ({ duration, target })),
    thresholds: {
        http_req_failed: ['rate<0.10'], // a burst may cost some errors; more than 10 % = didn't survive
        ...perStageThresholds('http_req_duration', STAGES, 'p(95)<2000'),
    },
}

export default function (): void {
    tagStage(STAGES)
    getHome()
    sleep(1)
}
