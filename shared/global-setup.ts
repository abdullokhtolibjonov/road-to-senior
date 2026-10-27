import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// allure-playwright never deletes old results, so without this every run piles on top of the last
// one and the Allure report shows earlier runs as retries. Runs once, before any test.
export default function globalSetup(): void {
    const allureResults = fileURLToPath(new URL('../allure-results', import.meta.url))
    rmSync(allureResults, { recursive: true, force: true })
}
