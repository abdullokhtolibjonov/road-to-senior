import http from 'k6/http'
import { check } from 'k6'
import { BASE_URL } from '../config.ts'

interface PizzaResponse {
    pizza: { name: string; ingredients: unknown[] }
    calories: number
}

// Public demo token from k6's docs; QuickPizza accepts any 16-char token.
const DEMO_TOKEN = 'token abcdef0123456789'

// `tags.name` groups metrics per endpoint, so thresholds can target one:
// 'http_req_duration{name:pizza}': ['p(95)<1200']
export function getHome(): void {
    const res = http.get(`${BASE_URL}/`, { tags: { name: 'home' } })
    check(res, {
        'home: status 200': (r) => r.status === 200,
    })
}

export function postPizza(): void {
    const body = JSON.stringify({
        maxCaloriesPerSlice: 1000,
        mustBeVegetarian: false,
        excludedIngredients: [],
        excludedTools: [],
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
    })
    const res = http.post(`${BASE_URL}/api/pizza`, body, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: DEMO_TOKEN,
        },
        tags: { name: 'pizza' },
    })
    check(res, {
        'pizza: status 200': (r) => r.status === 200,
        'pizza: has a name': (r) => {
            // r.json() is untyped. This `as` is only a claim: k6 strips types and never verifies
            // it, so the optional chaining below is what actually protects us at runtime.
            const data = r.json() as unknown as PizzaResponse | null
            return typeof data?.pizza?.name === 'string' && data.pizza.name.length > 0
        },
    })
}
