import { sleep } from 'k6'
import type { Options } from 'k6/options'
import { DEFAULT_THRESHOLDS } from '../config.ts'
import { getHome, postPizza } from '../lib/requests.ts'

// Smoke: 1 VU, a handful of iterations. Answers "does the script work and is the system up?"
// Run it before every other test type: no point loading a system that fails for one user.
export const options: Options = {
    vus: 1,
    iterations: 5,
    thresholds: DEFAULT_THRESHOLDS,
}

// One iteration = one simulated user journey. Each VU runs this repeatedly.
export default function (): void {
    getHome()
    postPizza()
    sleep(1) // think time: real users pause between actions
}
