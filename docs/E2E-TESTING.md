# E2E Testing Plan (Playwright)

This is the deep-dive for Phases 1–3. It contains everything you need to finish the E2E suite
without outside help: the site map, a locator reference, a step-by-step walkthrough with hints,
and collapsed reference solutions.

> **Rule for the reference solutions:** try the step first (15–30 min), *then* open the
> `<details>` block. If you open it, close it again and type the code yourself — don't paste.

---

## 1. Target: https://www.saucedemo.com

### Accounts (password for all: `secret_sauce`)

| Username | Behavior | How to use it in tests |
|---|---|---|
| `standard_user` | Normal happy path | Default for almost every test |
| `locked_out_user` | Login always fails with "locked out" error | Negative login test |
| `problem_user` | Bugs baked in: all product images identical, sorting broken, some Add-to-cart/Remove buttons don't work, typing Last Name on checkout overwrites First Name | Tests that **document known bugs** with `test.fail()` |
| `performance_glitch_user` | Login takes ~5 s | Test that login still succeeds within a raised timeout |
| `error_user` | Some actions throw JS errors (e.g. some cart buttons, finishing checkout) | Optional, explore manually first |
| `visual_user` | Visual differences (wrong images/prices/alignment) | Only for the visual-regression stretch goal |

> These behaviors change occasionally. Before writing a test around a quirk, log in manually and
> confirm it.

### Site map

| Page | URL path | Reached by |
|---|---|---|
| Login | `/` | start |
| Inventory (Products) | `/inventory.html` | successful login |
| Product details | `/inventory-item.html?id=<n>` | clicking a product name/image |
| Cart | `/cart.html` | cart icon in the header |
| Checkout step 1 (Your Information) | `/checkout-step-one.html` | Checkout button in cart |
| Checkout step 2 (Overview) | `/checkout-step-two.html` | Continue on step 1 |
| Checkout complete | `/checkout-complete.html` | Finish on step 2 |

Opening a protected URL (e.g. `/inventory.html`) while logged out redirects to `/` and shows an
error like *"Epic sadface: You can only access '/inventory.html' when you are logged in."* — a nice
extra negative test.

Session details (useful for `storageState` in Phase 3): the login is stored in a cookie named
`session-username`, and the cart contents in `localStorage` key `cart-contents` (created once you add an item — check in DevTools → Application → Local Storage).

### Locator reference (`data-test` attributes)

Your config already sets `testIdAttribute: 'data-test'`, so `page.getByTestId('username')` targets
`[data-test="username"]`. Verify any of these in DevTools (F12 → Elements → Ctrl+F `data-test=`)
if a locator doesn't match — the site can change.

| Page | Element | Locator |
|---|---|---|
| Login | Username input | `getByTestId('username')` |
| | Password input | `getByTestId('password')` |
| | Login button | `getByTestId('login-button')` |
| | Error message (`<h3>`) | `getByTestId('error')` |
| Header (all logged-in pages) | Page title ("Products", "Your Cart", …) | `getByTestId('title')` |
| | Cart link/icon | `getByTestId('shopping-cart-link')` |
| | Cart badge (count; **absent when 0**) | `getByTestId('shopping-cart-badge')` |
| | Burger menu button | `getByRole('button', { name: 'Open Menu' })` |
| | Logout / Reset App State (in menu) | `getByTestId('logout-sidebar-link')` / `getByTestId('reset-sidebar-link')` |
| Inventory | One product card | `getByTestId('inventory-item')` |
| | Product name / price / description | `getByTestId('inventory-item-name')` / `'inventory-item-price'` / `'inventory-item-desc'` |
| | Sort dropdown (`<select>`) | `getByTestId('product-sort-container')` — option values `az`, `za`, `lohi`, `hilo` |
| | Add / Remove button inside a card | `card.getByRole('button', { name: 'Add to cart' })` / `{ name: 'Remove' }` |
| Product details | Name / price | `getByTestId('inventory-item-name')` / `'inventory-item-price'` |
| | Add / Remove | `getByRole('button', { name: 'Add to cart' })` / `{ name: 'Remove' }` |
| | Back | `getByTestId('back-to-products')` |
| Cart | Cart rows | `getByTestId('inventory-item')` (same id as inventory) |
| | Checkout / Continue Shopping | `getByTestId('checkout')` / `getByTestId('continue-shopping')` |
| Checkout 1 | First / last name / postal code | `getByTestId('firstName')` / `'lastName'` / `'postalCode'` |
| | Continue / Cancel | `getByTestId('continue')` / `getByTestId('cancel')` |
| | Error | `getByTestId('error')` |
| Checkout 2 | Item total / Tax / Total labels | `getByTestId('subtotal-label')` / `'tax-label'` / `'total-label'` |
| | Finish | `getByTestId('finish')` |
| Complete | Header ("Thank you for your order!") | `getByTestId('complete-header')` |
| | Back Home | `getByTestId('back-to-products')` |

**Why `getByRole` for the Add/Remove buttons:** their test ids are generated from the product name
(`add-to-cart-sauce-labs-backpack`). Filtering the card by product name and then finding the button
by role is more readable and doesn't depend on that naming scheme.

### Known texts & data

- Error messages (login):
  - `Epic sadface: Sorry, this user has been locked out.`
  - `Epic sadface: Username and password do not match any user in this service`
  - `Epic sadface: Username is required`
  - `Epic sadface: Password is required`
- Error messages (checkout step 1): `Error: First Name is required`, `Error: Last Name is required`,
  `Error: Postal Code is required`
- 6 products:

  | Name | Price |
  |---|---|
  | Sauce Labs Backpack | 29.99 |
  | Sauce Labs Bike Light | 9.99 |
  | Sauce Labs Bolt T-Shirt | 15.99 |
  | Sauce Labs Fleece Jacket | 49.99 |
  | Sauce Labs Onesie | 7.99 |
  | Test.allTheThings() T-Shirt (Red) | 15.99 |

- Tax is **8 %** of the item total, rounded to cents. Example: Backpack + Bike Light →
  Item total $39.98, Tax $3.20, Total $43.18.

---

## 2. Target folder structure

```
e2e/
├── fixtures/
│   └── test.ts                  # test.extend<...>() — ALL specs import test/expect from here
├── pages/
│   ├── BasePage.ts
│   ├── components/
│   │   └── HeaderComponent.ts
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── ProductDetailsPage.ts
│   ├── CartPage.ts
│   ├── CheckoutInfoPage.ts
│   ├── CheckoutOverviewPage.ts
│   └── CheckoutCompletePage.ts
├── test-data/
│   ├── users.ts
│   ├── products.ts
│   └── messages.ts              # expected error texts
├── utils/
│   └── money.ts                 # parsePrice(), toCents()
└── tests/
    ├── auth.setup.ts            # Phase 3 (storageState)
    ├── login.spec.ts
    ├── inventory.spec.ts
    ├── cart.spec.ts
    ├── checkout.spec.ts
    └── network.spec.ts          # Phase 3 (page.route)
```

Import rule for your project: your tsconfig has `allowImportingTsExtensions` + `module: nodenext`,
so relative imports **include the `.ts` extension**: `import { LoginPage } from '../pages/LoginPage.ts'`.
Use `import type { ... }` for things that are only types (`verbatimModuleSyntax` enforces this).

---

## 3. Phase 2 walkthrough — Page Object Model

### Step 2.1 — Typed test data (`e2e/test-data/users.ts`)

Goal: no magic strings like `'standard_user'` in tests. Currently the file defines `User` and
`creds` but exports nothing, so ESLint warns they're unused.

Hints:
- Use an object with `as const` so TypeScript keeps the literal values (`'standard_user'`, not
  `string`).
- `keyof typeof USERS` gives you the union of keys: `'standard' | 'lockedOut' | ...`.
- Export a helper `credentialsFor(key)` so tests say `credentialsFor('lockedOut')`.

<details>
<summary>Reference solution</summary>

```ts
// e2e/test-data/users.ts
export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const

export const PASSWORD = 'secret_sauce'

export type UserKey = keyof typeof USERS          // 'standard' | 'lockedOut' | ...
export type Username = (typeof USERS)[UserKey]    // 'standard_user' | 'locked_out_user' | ...

export interface Credentials {
  username: string
  password: string
}

export function credentialsFor(key: UserKey): Credentials {
  return { username: USERS[key], password: PASSWORD }
}
```

```ts
// e2e/test-data/messages.ts
export const LOGIN_ERRORS = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  invalid: 'Epic sadface: Username and password do not match any user in this service',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
} as const

export const CHECKOUT_ERRORS = {
  firstName: 'Error: First Name is required',
  lastName: 'Error: Last Name is required',
  postalCode: 'Error: Postal Code is required',
} as const
```

```ts
// e2e/test-data/products.ts
export interface Product {
  name: string
  price: number
}

export const PRODUCTS = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  onesie: { name: 'Sauce Labs Onesie', price: 7.99 },
  redTShirt: { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
} as const satisfies Record<string, Product>

export const PRODUCT_COUNT = Object.keys(PRODUCTS).length   // 6
```

`satisfies` checks that every entry matches `Product` **without** widening the type — you keep the
exact literal names for autocomplete.
</details>

### Step 2.2 — `BasePage`

Current code: `page` is `protected` but not `readonly`, `Locator` is imported but unused, and
`goto(url)` takes any URL (so every test must know the URL — that knowledge belongs to the page).

Hints:
- `abstract` class = can't be instantiated, only extended.
- Declare `protected abstract readonly path: string` — every subclass *must* define its URL path.
- `goto()` with no args navigates to `this.path` (relative paths resolve against `baseURL`).
- Add `expectLoaded()` that asserts the URL — handy after navigation.

<details>
<summary>Reference solution</summary>

```ts
// e2e/pages/BasePage.ts
import { expect, type Page } from '@playwright/test'

export abstract class BasePage {
  protected readonly page: Page
  protected abstract readonly path: string

  constructor(page: Page) {
    this.page = page
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path)
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(this.path)
  }
}
```

Why it's safe for a subclass to declare `protected readonly path = '/'` as a class field: fields
of the subclass are assigned right after `super()` returns, and `goto()` is only called later.
**Don't** use `this.path` inside the `BasePage` constructor — it would still be `undefined` there.
</details>

### Step 2.3 — `LoginPage` + refactor `login.spec.ts`

Hints:
- Locators are `readonly` public fields (tests may assert on them: `expect(loginPage.errorMessage)`).
- Actions are `async` methods returning `Promise<void>`.
- Creating a locator does **not** touch the browser — it's just a description. So it's fine to
  create them all in the constructor.
- Page objects should not contain assertions about *business outcomes* (that's the test's job),
  but small "am I on the right page" checks like `expectLoaded()` are fine.

<details>
<summary>Reference solution</summary>

```ts
// e2e/pages/LoginPage.ts
import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage.ts'
import { credentialsFor, type UserKey } from '../test-data/users.ts'

export class LoginPage extends BasePage {
  protected readonly path = '/'

  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.usernameInput = page.getByTestId('username')
    this.passwordInput = page.getByTestId('password')
    this.loginButton = page.getByTestId('login-button')
    this.errorMessage = page.getByTestId('error')
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async loginAs(user: UserKey): Promise<void> {
    const { username, password } = credentialsFor(user)
    await this.login(username, password)
  }
}
```

```ts
// e2e/tests/login.spec.ts (before fixtures exist — Step 2.6 simplifies this further)
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.ts'
import { LOGIN_ERRORS } from '../test-data/messages.ts'

test.describe('Login', () => {
  test('standard user lands on inventory', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs('standard')
    await expect(page).toHaveURL('/inventory.html')
  })

  test('locked out user sees an error', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs('lockedOut')
    await expect(loginPage.errorMessage).toHaveText(LOGIN_ERRORS.lockedOut)
    await loginPage.expectLoaded()
  })
})
```
</details>

### Step 2.4 — Inventory, Cart, Checkout pages

Decision to make first (write it in `ARCHITECTURE.md`): **one `CheckoutPage` or three classes?**
Recommendation: three (`CheckoutInfoPage`, `CheckoutOverviewPage`, `CheckoutCompletePage`) — each
has its own URL, and one class per URL keeps `path`/`expectLoaded()` meaningful.

Useful Playwright APIs for these pages:

| Need | API |
|---|---|
| Find the card for one product | `this.items.filter({ hasText: 'Sauce Labs Backpack' })` |
| Button inside that card | `card.getByRole('button', { name: 'Add to cart' })` |
| Choose a sort option | `select.selectOption('lohi')` |
| Read all texts (no auto-wait!) | `locator.allTextContents()` → `Promise<string[]>` |
| Assert a list of texts (auto-waits) | `await expect(locator).toHaveText(['a', 'b'])` |
| Count | `await expect(locator).toHaveCount(6)` |
| Read one text | `await locator.textContent()` → `string \| null` (strictNullChecks!) |

Money helper — parse `"Item total: $39.98"` → `39.98`, and compare money in **cents** to avoid
floating-point surprises (`0.1 + 0.2 !== 0.3`).

<details>
<summary>Reference solution — money utils</summary>

```ts
// e2e/utils/money.ts
export function parsePrice(text: string | null): number {
  const match = text?.match(/\$(\d+(?:\.\d{1,2})?)/)
  if (!match?.[1]) {
    throw new Error(`Could not parse a price from: "${text}"`)
  }
  return Number(match[1])
}

export function toCents(amount: number): number {
  return Math.round(amount * 100)
}
```

Note `match?.[1]`: with `noUncheckedIndexedAccess` on, `match[1]` is `string | undefined`, so TS
forces you to handle the missing case. That's the flag doing its job.
</details>

<details>
<summary>Reference solution — InventoryPage & ProductDetailsPage</summary>

```ts
// e2e/pages/InventoryPage.ts
import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage.ts'
import { HeaderComponent } from './components/HeaderComponent.ts'
import { parsePrice } from '../utils/money.ts'

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo'

export class InventoryPage extends BasePage {
  protected readonly path = '/inventory.html'

  readonly header: HeaderComponent
  readonly title: Locator
  readonly items: Locator
  readonly itemNames: Locator
  readonly itemPrices: Locator
  readonly sortSelect: Locator

  constructor(page: Page) {
    super(page)
    this.header = new HeaderComponent(page)
    this.title = page.getByTestId('title')
    this.items = page.getByTestId('inventory-item')
    this.itemNames = page.getByTestId('inventory-item-name')
    this.itemPrices = page.getByTestId('inventory-item-price')
    this.sortSelect = page.getByTestId('product-sort-container')
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name })
  }

  async addToCart(name: string): Promise<void> {
    await this.item(name).getByRole('button', { name: 'Add to cart' }).click()
  }

  async removeFromCart(name: string): Promise<void> {
    await this.item(name).getByRole('button', { name: 'Remove' }).click()
  }

  async openDetails(name: string): Promise<void> {
    await this.itemNames.filter({ hasText: name }).click()
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option)
  }

  async getNames(): Promise<string[]> {
    return this.itemNames.allTextContents()
  }

  async getPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents()
    return texts.map(parsePrice)
  }
}
```

```ts
// e2e/pages/ProductDetailsPage.ts
import { expect, type Locator, type Page } from '@playwright/test'
import { BasePage } from './BasePage.ts'

export class ProductDetailsPage extends BasePage {
  // id varies, so goto() isn't really meaningful here; expectLoaded() uses a regex instead
  protected readonly path = '/inventory-item.html'

  readonly name: Locator
  readonly price: Locator
  readonly addButton: Locator
  readonly removeButton: Locator
  readonly backButton: Locator

  constructor(page: Page) {
    super(page)
    this.name = page.getByTestId('inventory-item-name')
    this.price = page.getByTestId('inventory-item-price')
    this.addButton = page.getByRole('button', { name: 'Add to cart' })
    this.removeButton = page.getByRole('button', { name: 'Remove' })
    this.backButton = page.getByTestId('back-to-products')
  }

  override async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/inventory-item\.html\?id=\d+/)
    // saucedemo is a single-page app: the URL changes BEFORE the new page is rendered.
    // Without this line, `name`/`price` can still match the 6 items of the inventory page
    // → "strict mode violation". (Found by actually running this code — a real race condition.)
    await expect(this.backButton).toBeVisible()
  }
}
```
`override` documents that you
intentionally replace the base method; enable `"noImplicitOverride": true` in tsconfig to make it
mandatory.
</details>

<details>
<summary>Reference solution — CartPage & checkout pages</summary>

```ts
// e2e/pages/CartPage.ts
import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage.ts'
import { HeaderComponent } from './components/HeaderComponent.ts'

export class CartPage extends BasePage {
  protected readonly path = '/cart.html'

  readonly header: HeaderComponent
  readonly items: Locator
  readonly itemNames: Locator
  readonly itemPrices: Locator
  readonly checkoutButton: Locator
  readonly continueShoppingButton: Locator

  constructor(page: Page) {
    super(page)
    this.header = new HeaderComponent(page)
    this.items = page.getByTestId('inventory-item')
    this.itemNames = page.getByTestId('inventory-item-name')
    this.itemPrices = page.getByTestId('inventory-item-price')
    this.checkoutButton = page.getByTestId('checkout')
    this.continueShoppingButton = page.getByTestId('continue-shopping')
  }

  async remove(name: string): Promise<void> {
    await this.items.filter({ hasText: name }).getByRole('button', { name: 'Remove' }).click()
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click()
  }
}
```

```ts
// e2e/pages/CheckoutInfoPage.ts
import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage.ts'

export interface CheckoutInfo {
  firstName: string
  lastName: string
  postalCode: string
}

export class CheckoutInfoPage extends BasePage {
  protected readonly path = '/checkout-step-one.html'

  readonly firstNameInput: Locator
  readonly lastNameInput: Locator
  readonly postalCodeInput: Locator
  readonly continueButton: Locator
  readonly cancelButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.firstNameInput = page.getByTestId('firstName')
    this.lastNameInput = page.getByTestId('lastName')
    this.postalCodeInput = page.getByTestId('postalCode')
    this.continueButton = page.getByTestId('continue')
    this.cancelButton = page.getByTestId('cancel')
    this.errorMessage = page.getByTestId('error')
  }

  // Partial<> lets negative tests leave a field empty: fillInfo({ firstName: 'A', lastName: 'B' })
  async fillInfo(info: Partial<CheckoutInfo>): Promise<void> {
    if (info.firstName !== undefined) await this.firstNameInput.fill(info.firstName)
    if (info.lastName !== undefined) await this.lastNameInput.fill(info.lastName)
    if (info.postalCode !== undefined) await this.postalCodeInput.fill(info.postalCode)
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
```

```ts
// e2e/pages/CheckoutOverviewPage.ts
import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage.ts'
import { parsePrice } from '../utils/money.ts'

export interface OrderSummary {
  subtotal: number
  tax: number
  total: number
}

export class CheckoutOverviewPage extends BasePage {
  protected readonly path = '/checkout-step-two.html'

  readonly itemNames: Locator
  readonly subtotalLabel: Locator
  readonly taxLabel: Locator
  readonly totalLabel: Locator
  readonly finishButton: Locator

  constructor(page: Page) {
    super(page)
    this.itemNames = page.getByTestId('inventory-item-name')
    this.subtotalLabel = page.getByTestId('subtotal-label')
    this.taxLabel = page.getByTestId('tax-label')
    this.totalLabel = page.getByTestId('total-label')
    this.finishButton = page.getByTestId('finish')
  }

  async getSummary(): Promise<OrderSummary> {
    return {
      subtotal: parsePrice(await this.subtotalLabel.textContent()),
      tax: parsePrice(await this.taxLabel.textContent()),
      total: parsePrice(await this.totalLabel.textContent()),
    }
  }

  async finish(): Promise<void> {
    await this.finishButton.click()
  }
}
```

```ts
// e2e/pages/CheckoutCompletePage.ts
import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage.ts'

export class CheckoutCompletePage extends BasePage {
  protected readonly path = '/checkout-complete.html'

  readonly completeHeader: Locator
  readonly backHomeButton: Locator

  constructor(page: Page) {
    super(page)
    this.completeHeader = page.getByTestId('complete-header')
    this.backHomeButton = page.getByTestId('back-to-products')
  }
}
```
</details>

### Step 2.5 — `HeaderComponent` (composition over inheritance)

The header exists on every logged-in page, but "a CartPage **is a** Header" is wrong — a CartPage
**has a** header. So it's a separate class (not extending `BasePage`, it has no URL), held as a
field by pages that show it.

<details>
<summary>Reference solution</summary>

```ts
// e2e/pages/components/HeaderComponent.ts
import type { Locator, Page } from '@playwright/test'

export class HeaderComponent {
  readonly cartLink: Locator
  readonly cartBadge: Locator
  readonly menuButton: Locator
  readonly logoutLink: Locator
  readonly resetAppStateLink: Locator

  constructor(page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link')
    this.cartBadge = page.getByTestId('shopping-cart-badge')
    this.menuButton = page.getByRole('button', { name: 'Open Menu' })
    this.logoutLink = page.getByTestId('logout-sidebar-link')
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link')
  }

  async openCart(): Promise<void> {
    await this.cartLink.click()
  }

  async logout(): Promise<void> {
    await this.menuButton.click()
    await this.logoutLink.click()
  }
}
```

In a test: `await expect(inventoryPage.header.cartBadge).toHaveText('2')`, and for an empty cart
`await expect(inventoryPage.header.cartBadge).toBeHidden()`.
</details>

### Step 2.6 — Custom fixtures (`e2e/fixtures/test.ts`)

Why: without fixtures every test repeats `new LoginPage(page)`, `goto()`, `loginAs(...)`. A fixture
is a function Playwright runs *before* the test (setup), hands a value to the test via `use(...)`,
and continues *after* the test (teardown).

Anatomy:
```ts
myFixture: async ({ page /* other fixtures it depends on */ }, use) => {
  // setup
  await use(valueGivenToTheTest)
  // teardown (runs after the test, even if it failed)
}
```

Hints:
- `test.extend<T>()` — `T` is an object type listing each fixture name and its value type.
- An **option** fixture (`[defaultValue, { option: true }]`) can be overridden per file/describe
  with `test.use({ ... })` — perfect for "which user to log in as".
- Re-export `expect` from the same file so specs have one import line.
- ESLint `no-empty-pattern` complains about `async ({}, use) =>` — always destructure at least one
  fixture, or disable that rule for the fixtures file with a comment explaining why.

<details>
<summary>Reference solution</summary>

```ts
// e2e/fixtures/test.ts
import { test as base, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.ts'
import { InventoryPage } from '../pages/InventoryPage.ts'
import { ProductDetailsPage } from '../pages/ProductDetailsPage.ts'
import { CartPage } from '../pages/CartPage.ts'
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage.ts'
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage.ts'
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage.ts'
import type { UserKey } from '../test-data/users.ts'

interface PageFixtures {
  loginPage: LoginPage
  inventoryPage: InventoryPage
  productDetailsPage: ProductDetailsPage
  cartPage: CartPage
  checkoutInfoPage: CheckoutInfoPage
  checkoutOverviewPage: CheckoutOverviewPage
  checkoutCompletePage: CheckoutCompletePage
}

interface Options {
  user: UserKey
}

interface AuthFixtures {
  /** Logs in as `user` (default: standard) and returns the inventory page. */
  loggedIn: InventoryPage
}

export const test = base.extend<Options & PageFixtures & AuthFixtures>({
  user: ['standard', { option: true }],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page))
  },
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page))
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page))
  },
  checkoutInfoPage: async ({ page }, use) => {
    await use(new CheckoutInfoPage(page))
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page))
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page))
  },

  loggedIn: async ({ loginPage, inventoryPage, user }, use) => {
    await loginPage.goto()
    await loginPage.loginAs(user)
    await inventoryPage.expectLoaded()
    await use(inventoryPage)
  },
})

export { expect }
```

Usage:
```ts
// e2e/tests/cart.spec.ts
import { test, expect } from '../fixtures/test.ts'
import { PRODUCTS } from '../test-data/products.ts'

test('adding two items updates the badge', async ({ loggedIn }) => {
  await loggedIn.addToCart(PRODUCTS.backpack.name)
  await loggedIn.addToCart(PRODUCTS.bikeLight.name)
  await expect(loggedIn.header.cartBadge).toHaveText('2')
})

test.describe('as problem_user', () => {
  test.use({ user: 'problem' })   // overrides the `user` option for this describe block

  test('can still add an item', async ({ loggedIn }) => {
    await loggedIn.addToCart(PRODUCTS.backpack.name)
    await expect(loggedIn.header.cartBadge).toHaveText('1')
  })
})

// performance_glitch_user takes ~5 s to log in — longer than the 5 s expect timeout used inside
// the `loggedIn` fixture. So this test logs in manually and gives that one assertion more time.
test('performance_glitch_user can log in', async ({ page, loginPage }) => {
  test.slow()                                   // triples the TEST timeout (not expect timeouts)
  await loginPage.goto()
  await loginPage.loginAs('performanceGlitch')
  await expect(page).toHaveURL('/inventory.html', { timeout: 15_000 })
})
```

Fixtures are **lazy**: a test that doesn't list `loggedIn` never logs in.
</details>

**Phase 2 done when:** every spec imports from `../fixtures/test.ts`, no spec contains
`getByTestId`/`locator(`, typecheck + lint are clean, and tests pass twice in a row.

---

## 4. Scenario list (build incrementally)

Tick them off as you write them. Suggested file in brackets.

**Login** `[login.spec.ts]`
- [x] Successful login → redirected to inventory
- [ ] Locked-out user → error message shown, still on login page
- [ ] Invalid credentials → error message
- [ ] Empty username → "Username is required"
- [ ] Username but empty password → "Password is required"
- [ ] (data-driven) the 4 negative cases above generated from one array — see §5.2
- [ ] Opening `/inventory.html` while logged out → redirected to `/` with error
- [ ] Logout via burger menu → back on login page; browser Back doesn't show inventory
- [ ] `performance_glitch_user` logs in successfully (raise timeout with `test.slow()`)

**Inventory** `[inventory.spec.ts]`
- [ ] 6 products rendered (`toHaveCount(6)`)
- [ ] Sort A→Z, Z→A: compare displayed names against a sorted copy
- [ ] Sort price low→high, high→low: compare displayed prices against a sorted copy
- [ ] Add to cart → badge = 1; button text changes to "Remove"
- [ ] Remove from inventory page → badge disappears
- [ ] Product details page shows the same name/price as the card; add to cart from there
- [ ] `problem_user`: sorting is broken → mark with `test.fail()` (documents a known bug)

**Cart** `[cart.spec.ts]`
- [ ] Cart lists added items with correct names and prices
- [ ] Remove item in cart updates list and badge
- [ ] Continue Shopping returns to inventory, cart kept
- [ ] Cart survives a page reload (it's in localStorage)

**Checkout** `[checkout.spec.ts]`
- [ ] Full happy path (info → overview → complete; "Thank you for your order!"; badge gone)
- [ ] Missing first name / last name / postal code → matching error (data-driven)
- [ ] Order math: subtotal = sum of item prices; tax = round(subtotal × 0.08, 2); total =
      subtotal + tax — compare in cents
- [ ] Cancel on step 1 returns to cart

**Cross-cutting (Phase 3)** `[network.spec.ts]`
- [ ] `page.route` blocking all images → inventory still usable (6 items, add to cart works)
- [ ] `page.route` delaying resources → page still loads within your timeout
- [ ] (optional) API mocking exercise on `https://demo.playwright.dev/api-mocking` (§5.4)
- [ ] Smoke subset tagged `@smoke` runs on chromium **and** firefox

---

## 5. Phase 3 walkthrough — Advanced patterns

### 5.1 Verifying sort order properly

Bad: "select Z→A, expect no error". Good: read the list, compute the expected order yourself,
assert the page shows exactly that.

<details>
<summary>Reference solution</summary>

```ts
// e2e/tests/inventory.spec.ts
import { test, expect } from '../fixtures/test.ts'

test.describe('Inventory sorting', () => {
  test('name Z to A', async ({ loggedIn }) => {
    const names = await loggedIn.getNames()
    const expected = [...names].sort((a, b) => b.localeCompare(a))

    await loggedIn.sortBy('za')

    await expect(loggedIn.itemNames).toHaveText(expected)   // auto-retrying assertion
  })

  test('price low to high', async ({ loggedIn }) => {
    await loggedIn.sortBy('lohi')
    const prices = await loggedIn.getPrices()
    const expected = [...prices].sort((a, b) => a - b)
    expect(prices).toEqual(expected)
  })
})

test.describe('problem_user', () => {
  test.use({ user: 'problem' })

  test('sorting Z to A is broken (known bug)', async ({ loggedIn }) => {
    // passes only if the body FAILS; alerts you when the bug gets fixed.
    // The list reporter shows it with ✘ but counts it under "passed" — that's expected.
    test.fail()
    const names = await loggedIn.getNames()
    await loggedIn.sortBy('za')
    await expect(loggedIn.itemNames).toHaveText([...names].sort((a, b) => b.localeCompare(a)))
  })
})
```

Why `[...names].sort()`: `.sort()` mutates the array in place; copying first keeps `names` intact.
Why `(a, b) => a - b` for numbers: default `.sort()` compares as **strings** (`[10, 9].sort()` →
`[10, 9]`).
</details>

### 5.2 Data-driven tests

Generate one test per case from an array. Each case gets its own name in the report.

<details>
<summary>Reference solution</summary>

```ts
// e2e/tests/login.spec.ts
import { test, expect } from '../fixtures/test.ts'
import { USERS, PASSWORD } from '../test-data/users.ts'
import { LOGIN_ERRORS } from '../test-data/messages.ts'

interface LoginErrorCase {
  title: string
  username: string
  password: string
  error: string
}

const errorCases: LoginErrorCase[] = [
  { title: 'locked out user', username: USERS.lockedOut, password: PASSWORD, error: LOGIN_ERRORS.lockedOut },
  { title: 'wrong password', username: USERS.standard, password: 'nope', error: LOGIN_ERRORS.invalid },
  { title: 'empty username', username: '', password: PASSWORD, error: LOGIN_ERRORS.usernameRequired },
  { title: 'empty password', username: USERS.standard, password: '', error: LOGIN_ERRORS.passwordRequired },
]

test.describe('Login errors', () => {
  for (const c of errorCases) {
    test(`shows an error for ${c.title}`, async ({ loginPage }) => {
      await loginPage.goto()
      await loginPage.login(c.username, c.password)
      await expect(loginPage.errorMessage).toHaveText(c.error)
      await loginPage.expectLoaded()
    })
  }
})
```

Test titles must be unique — that's why each case has a `title`.
</details>

### 5.3 Faster login with `storageState` (setup project)

Logging in through the UI in every test is slow. Instead: a **setup** project logs in once, saves
cookies + localStorage to a JSON file, and the browser projects start every test already logged in.

1. Create `e2e/tests/auth.setup.ts` (it must be inside `testDir`).
2. Add a `setup` project and make browser projects depend on it.
3. `playwright/.auth/` is already in your `.gitignore` — never commit auth files.
4. Tests that must start **logged out** (login tests) opt out:
   `test.use({ storageState: { cookies: [], origins: [] } })`.
5. With storageState, a "logged in" test just does `await inventoryPage.goto()` — no UI login.

Note: saucedemo's session cookie expires after a few minutes, which is fine for a test run but
means you can't reuse an old auth file tomorrow — the setup project regenerates it every run.

<details>
<summary>Reference solution</summary>

```ts
// e2e/tests/auth.setup.ts
import { test as setup } from '../fixtures/test.ts'

export const STANDARD_AUTH_FILE = 'playwright/.auth/standard.json'

setup('authenticate as standard_user', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.goto()
  await loginPage.loginAs('standard')
  await inventoryPage.expectLoaded()
  await page.context().storageState({ path: STANDARD_AUTH_FILE })
})
```

```ts
// playwright.config.ts (projects part)
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/standard.json' },
    dependencies: ['setup'],
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/standard.json' },
    dependencies: ['setup'],
  },
],
```

Keep the `loggedIn` fixture from Step 2.6 too: it's still the right tool for tests that need a
*different* user (`test.use({ user: 'problem' })` + a cleared storageState).
</details>

### 5.4 Network interception (`page.route`)

saucedemo is a static single-page app: product data is bundled in the JavaScript, so there's no
JSON API to mock. What you *can* intercept are images, scripts, and the HTML itself. Realistic
exercises:

| Exercise | How |
|---|---|
| Block all images; app must still work | `await page.route(/\.(png\|jpe?g\|svg)$/, route => route.abort())` |
| Slow network for static files | in the handler: `await new Promise(r => setTimeout(r, 1500)); await route.continue()` |
| Count/inspect requests | `page.on('request', req => ...)` or `const res = await page.waitForResponse(/inventory/)` |
| Serve a 500 for a page | `route.fulfill({ status: 500, body: 'Server error' })` on `**/inventory.html`, then assert what the user sees |

For **real JSON API mocking** practice, use Playwright's own demo page
`https://demo.playwright.dev/api-mocking`, which fetches fruits from `*/**/api/v1/fruits`:

<details>
<summary>Reference solution — mocking with a discriminated union</summary>

```ts
// e2e/tests/network.spec.ts
import { test, expect } from '../fixtures/test.ts'
import type { Page } from '@playwright/test'

type MockScenario =
  | { kind: 'success'; fruits: { name: string; id: number }[] }
  | { kind: 'serverError'; status: 500 | 503 }
  | { kind: 'slow'; delayMs: number }

async function mockFruitsApi(page: Page, scenario: MockScenario): Promise<void> {
  await page.route('*/**/api/v1/fruits', async (route) => {
    switch (scenario.kind) {
      case 'success':
        await route.fulfill({ json: scenario.fruits })        // TS knows `fruits` exists here
        return
      case 'serverError':
        await route.fulfill({ status: scenario.status, body: 'boom' })
        return
      case 'slow':
        await new Promise((r) => setTimeout(r, scenario.delayMs))
        await route.continue()
        return
      default: {
        const unreachable: never = scenario                    // compile error if a case is missing
        throw new Error(`Unhandled scenario: ${JSON.stringify(unreachable)}`)
      }
    }
  })
}

test('shows mocked fruit', async ({ page }) => {
  await mockFruitsApi(page, { kind: 'success', fruits: [{ name: 'Mocked Mango', id: 1 }] })
  await page.goto('https://demo.playwright.dev/api-mocking')
  await expect(page.getByText('Mocked Mango')).toBeVisible()
})

test('saucedemo still works without images', { tag: '@smoke' }, async ({ page, loggedIn }) => {
  await page.route(/\.(png|jpe?g|svg)$/, (route) => route.abort())
  await page.reload()
  await expect(loggedIn.items).toHaveCount(6)
})
```
`page.route` must be registered **before** the navigation that triggers the request.
</details>

### 5.5 Tags, grep, annotations

```ts
test('checkout happy path', { tag: ['@smoke', '@checkout'] }, async ({ loggedIn }) => { ... })
```

| Command | Runs |
|---|---|
| `npx playwright test --grep @smoke` | only smoke |
| `npx playwright test --grep-invert @slow` | everything except slow |
| `npx playwright test --project=firefox` | one browser |
| `npx playwright test login.spec.ts:12` | the test at line 12 |
| `npx playwright test --repeat-each=5` | each test 5× — flakiness hunt |
| `npx playwright test --last-failed` | only what failed last run |

Annotations: `test.skip(condition, reason)`, `test.fixme()`, `test.fail()` (expected to fail),
`test.slow()` (triples timeout), `test.step('name', async () => {...})` (named steps in reports).

Add npm scripts, e.g. `"test:smoke": "playwright test --grep @smoke"`.

### 5.6 Retries & flakiness

Add to `playwright.config.ts`:
```ts
retries: process.env.CI ? 2 : 0,
forbidOnly: !!process.env.CI,   // fail CI if someone left test.only in the code
workers: process.env.CI ? 1 : undefined,
```
(`process.env` needs Node types — see `TROUBLESHOOTING.md` → "Cannot find name 'process'".)

**Important with your current config:** `trace: 'on-first-retry'` and `video: 'on-first-retry'`
only record when a test is *retried*. With `retries: 0` locally you'll never get a trace. Use
`trace: 'retain-on-failure'` locally or run `npx playwright test --trace on` when debugging.

Common flakiness root causes and real fixes:

| Symptom | Root cause | Fix |
|---|---|---|
| Reads old value | `allTextContents()`/`textContent()` don't wait | use `await expect(locator).toHaveText(...)` |
| "strict mode violation" | locator matches several elements | make it specific: `.filter({ hasText })`, `getByRole(..., { name })` |
| Passes alone, fails in parallel | tests share state (same user's server-side data, a file) | isolate data per test; saucedemo state is per browser context so it's usually safe |
| Timing-dependent click | clicking before app is ready | assert page is loaded (`expectLoaded()`, a visible element) before acting |
| URL is right but elements are from the previous page | single-page app: URL updates before re-render | `expectLoaded()` also waits for an element unique to the new page (see `ProductDetailsPage`) |

Never "fix" with `page.waitForTimeout(...)`.

### 5.7 Useful config additions for Phase 3

```ts
export default defineConfig({
  testDir: 'e2e/tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [ /* setup, chromium, firefox — see 5.3 */ ],
})
```
Install extra browsers once: `npx playwright install firefox webkit`.

---

## 6. Design decisions to record (in `ARCHITECTURE.md`)

1. **Locator strategy** — `getByTestId` (data-test) first; `getByRole` for buttons inside a
   filtered container; never CSS classes like `.btn_inventory`.
2. **Page Object boundary** — one class per URL; shared UI (header) as a component.
3. **Fixture design** — page-object fixtures + `loggedIn` fixture with `user` option; storageState
   for the default user.
4. **Test data** — typed constants in `e2e/test-data/`; generated data (faker) from Phase 6.
5. **Assertions live in tests**, page objects expose locators and actions (plus `expectLoaded()`).

## 7. Explicitly out of scope

- Don't build a generic "any e-commerce site" abstraction.
- Don't chase 100 % coverage of saucedemo quirks — architecture + TypeScript are the goal.
