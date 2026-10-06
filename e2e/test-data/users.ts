interface User {
    username: string
    password: string
}

export const USER_ROLES = {
    standardUser: 'standard_user',
    lockedUser: 'locked_out_user',
    problemUser: 'problem_user',
    performanceUser: 'performance_glitch_user',
    errorUser: 'error_user',
    visualUser: 'visual_user'
} as const

export type Role = keyof typeof USER_ROLES // standardUser | lockedUser | problemUser...

const PASSWORD = 'secret_sauce'

export function credentialsFor(key: Role): User {
    return {
        username: USER_ROLES[key],
        password: PASSWORD
    }
}