export type SortOption = 'az' | 'za' | 'lohi' | 'hilo'

export type CheckoutInfo = {
    firstName: string
    lastName: string
    postalCode: string
}

export type CheckoutSummary = {
    subtotal: number
    tax: number
    total: number
}