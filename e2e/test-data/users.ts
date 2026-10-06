interface User {
    username: string
    password: string
}

const USER_ROLES = {
    standardUser: 'standard_user',
    lockedUser: 'locked_out_user',
    problemUser: 'problem_user',
    performanceUser: 'performance_glitch_user',
    errorUser: 'error_user',
    visualUser: 'visual_user'
}

type Role = keyof typeof USER_ROLES // standardUser | lockedUser | problemUser...

const PASSWORD: string = 'secret_sauce'

export function credentialsFor(key: Role): { username: string, password: string } {
    return {
        username: USER_ROLES[key],
        password: PASSWORD
    }
}