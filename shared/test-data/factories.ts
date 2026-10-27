import { faker } from '@faker-js/faker'
import type { CheckoutInfo } from '../../e2e/utils/types/types'
import type { UserPayload } from '../../api/schemas/user.schema'

// Each call returns fresh random data. Pass overrides for the fields a test cares about:
// the caller's values win because they're spread last.

export function makeCheckoutInfo(overrides: Partial<CheckoutInfo> = {}): CheckoutInfo {
    return {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        postalCode: faker.location.zipCode(),
        ...overrides
    }
}

export function makeUserPayload(overrides: Partial<UserPayload> = {}): UserPayload {
    return {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        age: faker.number.int({ min: 18, max: 80 }),
        ...overrides
    }
}
