import exec from 'k6/execution'

export interface NamedStage {
    name: string
    duration: string // k6 format, only s/m used here: '30s', '1m'
    target: number
}

function toMs(duration: string): number {
    const match = /^(\d+)(s|m)$/.exec(duration)
    if (!match) throw new Error(`Unsupported duration "${duration}" (use e.g. 30s or 1m)`)
    return Number(match[1]) * (match[2] === 'm' ? 60_000 : 1_000)
}

// k6 doesn't tell a VU which stage it is in, so derive it from the time since the test started.
export function currentStage(stages: readonly NamedStage[]): string {
    let elapsed = exec.instance.currentTestRunDuration
    for (const stage of stages) {
        elapsed -= toMs(stage.duration)
        if (elapsed < 0) return stage.name
    }
    // Past the last stage: k6's graceful stop lets running iterations finish.
    return stages.at(-1)?.name ?? 'after-end'
}

// Every metric this VU emits from now on carries `stage:<name>`, so thresholds and the summary
// can show one line per stage: 'http_req_duration{stage:spike}'.
export function tagStage(stages: readonly NamedStage[]): void {
    exec.vu.metrics.tags.stage = currentStage(stages)
}

// One threshold per stage on the same metric. The limit is only there to make k6 print the
// sub-metric in the summary; per-stage pass/fail is a bonus.
export function perStageThresholds(
    metric: string,
    stages: readonly NamedStage[],
    limit: string,
): Record<string, string[]> {
    return Object.fromEntries(stages.map((s) => [`${metric}{stage:${s.name}}`, [limit]]))
}
