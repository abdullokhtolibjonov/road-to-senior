# E2E Testing Plan (Playwright)

## Target: https://www.saucedemo.com

Known fixed accounts (password for all: `secret_sauce`):

| Username | Behavior |
|---|---|
| `standard_user` | Normal happy path |
| `locked_out_user` | Login always fails — good for negative test |
| `problem_user` | UI bugs baked in (e.g., broken images, sort issues) — good for exploratory/edge tests |
| `performance_glitch_user` | Artificial delay on load — useful later, don't over-invest early |
| `error_user`, `visual_user` | Exist on some saucedemo variants — verify before relying on them |

## Scenario List (build incrementally, one per sub-phase)

**Login (Phase 1–3)**
- [ ] Successful login → redirected to inventory
- [ ] Locked-out user → error message shown, still on login page
- [ ] Invalid credentials → error message
- [ ] Empty fields → validation error

**Inventory (Phase 2–3)**
- [ ] Product list renders with expected count
- [ ] Sort by name (A-Z, Z-A) and by price (low-high, high-low) — verify actual order, not just
      "no error"
- [ ] Add to cart updates cart badge count
- [ ] Add to cart from product detail page

**Cart & Checkout (Phase 2–3)**
- [ ] Cart reflects added items with correct names/prices
- [ ] Remove item from cart updates badge and list
- [ ] Full checkout happy path (info → overview → complete)
- [ ] Checkout with missing required field → validation error
- [ ] Cart total math is correct (item sum + tax = total) — this is a real assertion, not just
      "page shows a total"

**Cross-cutting (Phase 3)**
- [ ] One test using `page.route` to mock/intercept a request and assert on a scenario the real
      app can't produce (e.g., simulate a slow/broken response)
- [ ] Same suite (or a smoke subset) running against 2 browser projects

## Design Decisions to Make (record in ARCHITECTURE.md)

1. **Locator strategy** — saucedemo has `data-test` attributes on most elements. Prefer those via
   `getByTestId` (after configuring `testIdAttribute` if needed) over CSS classes, which are more
   brittle.
2. **Page Object boundary** — does `CheckoutPage` include all 3 checkout steps, or split into
   `CheckoutInfoPage`/`CheckoutOverviewPage`/`CheckoutCompletePage`? Either is defensible — decide
   and note why.
3. **Fixture design** — an `authenticatedPage` fixture that logs in as `standard_user` by default,
   parameterizable for other users. Avoid repeating login steps in every test.
4. **Test data** — user credentials and expected product data belong in a typed config/const file,
   not inline strings per test.

## Explicitly Out of Scope (for this project)

- Don't build a fully generic "any e-commerce site" abstraction — you're testing saucedemo
  specifically; over-abstracting for imagined reuse fights the "no premature abstraction" habit
  you're also trying to build as an engineer.
- Don't chase 100% coverage of every saucedemo quirk — the goal is architecture + TypeScript
  practice, not exhaustive test coverage of a demo site.
