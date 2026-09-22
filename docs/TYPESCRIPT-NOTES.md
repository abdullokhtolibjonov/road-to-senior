# TypeScript Concept Checklist

Since mastering TypeScript is the actual point of this project, use this as a checklist you tick
off *with evidence* — a file/line reference to where you used the concept for a real reason, not a
toy example. If you can't point to where you used it, you haven't learned it yet, you've read
about it.

Ordered roughly by the phase that first needs it (see `ROADMAP.md`), but concepts compound — you'll
keep using Phase 0 concepts in Phase 7.

## Phase 0 — Config & Basics
- [ ] `tsconfig.json`: `strict`, `noImplicitAny`, `strictNullChecks`, `esModuleInterop`, `target`,
      `module` — know what each does
- [ ] `any` vs `unknown` — where `unknown` forces you to narrow before use
- [ ] Basic types: primitives, arrays, tuples, `readonly` arrays

## Phase 1 — Functions & Async
- [ ] Function type annotations (params + return type) — and when to let inference handle the
      return type instead
- [ ] `Promise<T>` and `async`/`await` typing
- [ ] Reading library types (hover Playwright's `Page`, `Locator`, `expect` in your editor —
      understand you're reading real `.d.ts` files, not magic)

## Phase 2 — Classes & Object Shapes
- [ ] `interface` vs `type` alias — pick a convention, write the reason in `ARCHITECTURE.md`
- [ ] Classes: constructors, `private`/`protected`/`public`, `readonly` fields
- [ ] Generics basics: a generic function or class (e.g., `test.extend<MyFixtures>()`)
- [ ] String literal union types / enums for closed sets of values (e.g., saucedemo user types)

## Phase 3 — Narrowing & Utility Types
- [ ] Type narrowing (`typeof`, `in`, custom type guards `function isX(v): v is X`)
- [ ] Discriminated unions (a `type` field that lets TS narrow a union automatically)
- [ ] Utility types: `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Required<T>`

## Phase 4 — Generics in Practice & Schema-First Types
- [ ] A generic API client method: `get<T>(url: string): Promise<T>`
- [ ] Mapped types (even a simple one)
- [ ] `zod` schema → `z.infer<typeof schema>` (or equivalent with `ajv`) — understand *why*
      deriving types from runtime validation is safer than writing the interface by hand and hoping
      the API matches it

## Phase 5 — Where TypeScript's Guarantees End
- [ ] Understand that k6 executes plain JS (via its own Goja/JS runtime) — your `.ts` files are
      transpiled away before k6 ever runs them, so a `k6` script has **zero runtime type safety**,
      only design-time. This is worth sitting with: type checking catches bugs *before* the load
      test runs, but a bad type assertion (`as SomeType`) can still blow up at runtime with no net.

## Phase 6 — Factories & Composability
- [ ] Typed factory functions returning domain objects (`function makeUser(): User`)
- [ ] Composing overrides with `Partial<T>` (`makeUser({ email: "x" })`)

## Ongoing / Don't-Forget List
- [ ] Never silence a type error with `// @ts-ignore` without a comment explaining why — if you
      need one, that's a signal something's off (usually a 3rd-party lib's types, not your code)
- [ ] Prefer `unknown` + narrowing over `any` when typing something you don't control yet
- [ ] Re-read `strict` mode errors instead of reflexively adding `!` (non-null assertion) —
      each `!` is a claim you're making to the compiler; make sure it's true
