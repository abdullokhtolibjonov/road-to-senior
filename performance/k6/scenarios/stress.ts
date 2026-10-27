import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { assertLocalTarget } from '../config.ts'
import { getHome, postPizza } from '../lib/requests.ts'
import { type NamedStage, perStageThresholds, tagStage } from '../lib/stages.ts'

// Stress: raise the load step by step past normal traffic. Answers "where does it break, and how?"
// (latency climbing first, or errors appearing). Local QuickPizza only — CI runs it as a service container.
assertLocalTarget()

const STAGES: readonly NamedStage[] = [
    { name: 'vus-20', duration: '1m', target: 20 },
    { name: 'vus-50', duration: '1m', target: 50 },
    { name: 'vus-100', duration: '1m', target: 100 },
    { name: 'vus-200', duration: '1m', target: 200 },
    { name: 'ramp-down', duration: '1m', target: 0 },
]

export const options: Options = {
    stages: STAGES.map(({ duration, target }) => ({ duration, target })),
    thresholds: {
        // abortOnFail: once the system is clearly broken, more load teaches nothing. delayAbortEval
        // skips the first seconds, when a few slow cold-start requests would trip it.
        // Note: these are cumulative over the whole run, so they trip a bit *after* the real
        // breaking step — the per-stage lines below show which step actually crossed the limit.
        http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '10s' }],
        http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: true, delayAbortEval: '10s' }],
        ...perStageThresholds('http_req_duration', STAGES, 'p(95)<2000'),
        ...perStageThresholds('http_req_failed', STAGES, 'rate<0.05'),
    },
}

export default function (): void {
    tagStage(STAGES)
    getHome()
    postPizza()
    sleep(1)
}
