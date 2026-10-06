# TypeScript Concept Checklist & Mini-Reference

Mastering TypeScript is the real point of this project. Tick each box **with evidence** — a
file/line reference where you used the concept for a real reason (e.g.
`- [x] readonly fields — e2e/pages/LoginPage.ts:8`). If you can't point to it, you've only read
about it.

Each concept has a short explanation and a test-automation-flavoured example so you can learn it
from this file alone. Official handbook: https://www.typescriptlang.org/docs/handbook/intro.html
(search "handbook <concept>").

Quick experiments: paste snippets into https://www.typescriptlang.org/play and hover things.

---

## Phase 0 — Config & Basics

- [ ] **`tsconfig.json` options** — what yours does:

  | Option | What it does |
  |---|---|
  | `strict: true` | turns on a family of checks, incl. `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, `alwaysStrict` |
  | `noImplicitAny` | error when TS can't infer a type and would silently use `any` (e.g. untyped function params) |
  | `strictNullChecks` | `null`/`undefined` are separate types; `string` can't be `null` unless you write `string \| null` |
  | `noUncheckedIndexedAccess` | `arr[0]` and `obj[key]` get `\| undefined` added — forces you to handle "not there" |
  | `exactOptionalPropertyTypes` | `{ a?: string }` means "key may be missing", **not** "may be `undefined`" |
  | `target: es2022` | which JS syntax the output uses (irrelevant with `noEmit`, but affects class fields semantics) |
  | `module: nodenext` | ESM/CJS rules like Node — relative imports need extensions |
  | `verbatimModuleSyntax` | type-only imports must say `import type` — they're removed at runtime |
  | `allowImportingTsExtensions` + `noEmit` | lets you write `import x from './a.ts'` (Playwright/k6 run TS directly) |
  | `esModuleInterop` | smoother default-imports from CommonJS packages |
  | `skipLibCheck` | don't type-check `.d.ts` files in `node_modules` (faster, avoids 3rd-party noise) |
  | `types: []` | don't auto-include any `@types/*` globals — that's why `process` is unknown (see TROUBLESHOOTING) |
  | `jsx: react-jsx` | not needed in this project — safe to remove |

- [ ] **`any` vs `unknown`**
  ```ts
  const a: any = JSON.parse(text)
  a.foo.bar()            // compiles, may crash at runtime — `any` turns checking OFF

  const u: unknown = JSON.parse(text)
  u.foo                  // ❌ compile error — you must narrow first
  if (typeof u === 'object' && u !== null && 'foo' in u) { /* now allowed */ }
  ```
  Rule: data from outside (JSON, API responses) is `unknown` until validated (zod does this in
  Phase 4).

- [ ] **Basic types, arrays, tuples, readonly arrays**
  ```ts
  const count: number = 6
  const names: string[] = ['a', 'b']
  const pair: [string, number] = ['Backpack', 29.99]      // tuple: fixed length & positions
  const sorts: readonly string[] = ['az', 'za']          // can't push/sort in place
  const USERS = { standard: 'standard_user' } as const   // deeply readonly literal types
  ```

## Phase 1 — Functions & Async

- [ ] **Function annotations** — annotate parameters always; return types either explicitly
  (public API, page-object methods) or inferred (small private helpers).
  ```ts
  function toCents(amount: number): number { return Math.round(amount * 100) }
  const add = (a: number, b: number) => a + b          // return type inferred: number
  function greet(name: string, greeting = 'Hi') { ... } // default param → optional
  ```
- [ ] **`Promise<T>` and `async`/`await`** — an `async` function always returns a `Promise`.
  ```ts
  async function getTitle(page: Page): Promise<string> {
    return (await page.title())      // forgetting `await` = a floating promise, a classic bug
  }
  ```
  ESLint rule worth enabling later: `@typescript-eslint/no-floating-promises` (needs type-aware
  linting — `tseslint.configs.recommendedTypeChecked`).
- [ ] **Reading library types** — Ctrl+click `Page` / `Locator` / `expect` in VS Code to open
  Playwright's `.d.ts` files. Read the JSDoc there — it's the same as the online docs.

## Phase 2 — Classes & Object Shapes

- [ ] **`interface` vs `type`**
  ```ts
  interface Credentials { username: string; password: string }  // objects, can be extended/merged
  type SortOption = 'az' | 'za' | 'lohi' | 'hilo'                 // unions, tuples, mapped types → type
  ```
  A common convention: `interface` for object shapes, `type` for everything else. Record yours in
  `ARCHITECTURE.md`.
- [ ] **Classes: access modifiers, `readonly`, `abstract`**
  ```ts
  abstract class BasePage {
    protected readonly page: Page           // visible in subclasses, not to tests, never reassigned
    protected abstract readonly path: string // every subclass MUST provide it
    constructor(page: Page) { this.page = page }
  }
  class LoginPage extends BasePage {
    protected readonly path = '/'
    readonly loginButton: Locator           // public by default
    private secretHelper() {}               // only inside LoginPage
  }
  ```
  `private` is compile-time only; `#field` (JS private) is enforced at runtime too.
- [ ] **Generics basics** — a type parameter is a "type variable" filled in by the caller.
  ```ts
  function first<T>(items: T[]): T | undefined { return items[0] }
  first(['a', 'b'])   // T = string
  test.extend<{ loginPage: LoginPage }>({ ... })   // you pass the fixture types in
  ```
- [ ] **Literal unions / `as const` / enums**
  ```ts
  type UserKey = 'standard' | 'lockedOut'          // closed set; typos are compile errors
  const USERS = { standard: 'standard_user' } as const
  type Key = keyof typeof USERS                      // derive the union from the object
  ```
  Prefer unions / `as const` over `enum` (enums generate runtime code and aren't "erasable" TS).

## Phase 3 — Narrowing & Utility Types

- [ ] **Narrowing** — TS refines a type after a check.
  ```ts
  function label(v: string | number) {
    if (typeof v === 'string') return v.toUpperCase()   // v: string here
    return v.toFixed(2)                                  // v: number here
  }
  if ('error' in body) { ... }                           // `in` narrowing
  function isUser(x: unknown): x is User { ... }         // custom type guard
  ```
- [ ] **Discriminated unions** — a shared literal field (`kind`) lets TS narrow automatically;
  `never` makes the switch exhaustive (see `E2E-TESTING.md` §5.4).
  ```ts
  type Mock = { kind: 'ok'; body: unknown } | { kind: 'error'; status: number }
  switch (m.kind) {
    case 'ok': m.body; break
    case 'error': m.status; break
    default: { const x: never = m }   // compile error if a new kind is added and not handled
  }
  ```
- [ ] **Utility types**
  ```ts
  Partial<CheckoutInfo>                 // all fields optional  → overrides, negative tests
  Required<T>                           // all fields required
  Pick<User, 'email' | 'id'>            // only these fields
  Omit<User, 'avatar'>                  // all except
  Record<UserKey, Credentials>          // object with these keys
  ReturnType<typeof makeUser>           // type of a function's result
  Awaited<ReturnType<typeof fetchIt>>   // unwrap a Promise
  ```
- [ ] **`satisfies`** — check a value against a type without losing its precise literal type.
  ```ts
  const PRODUCTS = { backpack: { name: 'Sauce Labs Backpack', price: 29.99 } } as const satisfies Record<string, Product>
  ```

## Phase 4 — Generics in Practice & Schema-First Types

- [ ] **Generic class/method** — `ApiResponse<T>` + `bodyAs<U>(schema)` in `API-TESTING.md`.
  Constraints: `function byId<T extends { id: number }>(items: T[], id: number)`.
- [ ] **Mapped types** — build a type by transforming another's keys.
  ```ts
  type Nullable<T> = { [K in keyof T]: T[K] | null }
  type Locators<T extends string> = { [K in T]: Locator }   // Locators<'username' | 'password'>
  ```
- [ ] **`z.infer<typeof schema>`** — the schema exists at runtime (validates real data), and the
  type is *derived* from it, so they can never drift apart. A hand-written interface is just a
  promise nobody checks at runtime.

## Phase 5 — Where TypeScript's Guarantees End

- [ ] k6 (and Node, and Playwright) **strip** your types before running. Types = design-time only.
  `r.json() as PizzaResponse` compiles fine and is still wrong at runtime if the API changes.
  Validation (zod / checks) is what protects runtime; types protect your editing.

## Phase 6 — Factories & Composability

- [ ] **Typed factory functions with overrides**
  ```ts
  import { faker } from '@faker-js/faker'
  import type { CheckoutInfo } from '../../e2e/pages/CheckoutInfoPage.ts'

  export function makeCheckoutInfo(overrides: Partial<CheckoutInfo> = {}): CheckoutInfo {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      postalCode: faker.location.zipCode(),
      ...overrides,               // caller's values win
    }
  }

  makeCheckoutInfo()                        // fully random
  makeCheckoutInfo({ postalCode: '' })      // negative test variant
  ```
  Reproducible failures: `faker.seed(123)` makes the random values the same every run — log the
  seed so a failing run can be replayed.

## Ongoing / Don't-Forget List

- [ ] No `// @ts-ignore` without a comment explaining why (prefer `// @ts-expect-error <reason>` —
      it errors when the problem disappears)
- [ ] `unknown` + narrowing over `any`
- [ ] Each `!` (non-null assertion) is a claim you make to the compiler — make sure it's true;
      usually an `if` or `?.` is better
- [ ] `as` casts are claims too — prefer validation (zod) or type guards
- [ ] Hover before you guess: VS Code shows the inferred type of anything
