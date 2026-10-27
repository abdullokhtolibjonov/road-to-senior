import { test as base } from '@playwright/test'
import { faker } from '@faker-js/faker'

type FakerFixtures = {
    fakerSeed: number
}

// Seeds faker before every test and writes the seed into the report, so a failure caused by
// random data can be replayed with the same values: FAKER_SEED=<seed> npx playwright test ...
// Only data made *inside* a test is covered; values built at file load (e.g. a data-driven
// cases array) are created before this runs — those show up in the step titles instead.
export const test = base.extend<FakerFixtures>({
    fakerSeed: [
        // Playwright needs the destructuring pattern even when no fixtures are used
        // eslint-disable-next-line no-empty-pattern
        async ({}, use, testInfo) => {
            const seed = process.env.FAKER_SEED ? Number(process.env.FAKER_SEED) : faker.seed()
            faker.seed(seed)
            testInfo.annotations.push({ type: 'faker seed', description: String(seed) })
            await use(seed)
            // allure-playwright reads annotations when the test starts, before this one exists,
            // so a failure also gets the seed as an attachment, which every reporter shows.
            if (testInfo.status !== testInfo.expectedStatus) {
                await testInfo.attach('faker seed', { body: `FAKER_SEED=${seed}`, contentType: 'text/plain' })
            }
        },
        { auto: true }
    ]
})
