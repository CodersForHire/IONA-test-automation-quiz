# Jeric Mark Calamba - DemoBlaze Playwright Suite

TypeScript + Playwright automation for the IONA QA Automation Engineer
assessment, targeting [DemoBlaze](https://www.demoblaze.com/).

This suite follows the repo's `playwright-testing-conventions.md`: file and
class naming (§4), role/label-first locators with a justifying comment
wherever CSS is the last resort (§5), assertions kept in the tests rather
than the page objects (§6), Faker-generated per-test data with no shared
fixed accounts (§7/§12), and API-driven setup for anything that's a
precondition rather than the behavior under test (§9).

## Structure

```
jericMarkCalamba/
├── pages/                          # Page Object Model - one class per screen/modal
│   ├── home.page.ts                # HomePage - nav bar, category filters, product grid
│   ├── product.page.ts             # ProductPage - product detail page + "Add to cart"
│   ├── cart.page.ts                # CartPage - cart table, total, "Place Order"
│   ├── login-modal.component.ts    # LoginModalComponent - #logInModal
│   ├── signup-modal.component.ts   # SignupModalComponent - #signInModal
│   └── checkout-modal.component.ts # CheckoutModalComponent - #orderModal + SweetAlert success dialog
├── support/
│   ├── apiHelpers.ts              # API-driven account seeding (§9)
│   └── dialogHelpers.ts           # native window.alert/confirm race-safe handling
├── data/
│   └── testData.ts                # generateNewUser()/buildCheckoutDetails() factories, exact alert copy
├── fixtures.ts                    # page objects wired up as test.extend() fixtures (§6)
├── guest-checkout.spec.ts         # AC #1
├── authenticated-checkout.spec.ts # AC #2
├── negative.spec.ts               # AC #3
└── regression.spec.ts             # extra coverage, not tied to one AC
```

`data/testData.ts` lives under `data/`, not `fixtures/`: the conventions
doc's §6 reserves "fixture" for a Playwright `test.extend()`-based
dependency-injection setup, and everything here is a plain data
generator/constant instead - matching §7's own `data/factories/` example
more closely. `LoginModalComponent`/`SignupModalComponent`/
`CheckoutModalComponent` use the doc's `Component` class suffix (§4)
rather than `Page`, since they're modal dialogs, not full pages.

`fixtures.ts` is the actual §6 fixture: every spec imports `test`/`expect`
from `./fixtures` instead of `@playwright/test`, and gets `home`, `product`,
`cart`, `checkout`, `login`, `signup` as ready-made page objects on the test
callback instead of constructing them by hand (`const home = new
HomePage(page)`) at the top of every test. A test that needs a *second*
page - only `regression.spec.ts`'s cart-persistence test does - still
constructs that one page object directly against its own extra `page`
instance, since these fixtures are wired to the primary `page` only.

Locators are built on stable, user-facing signals - accessible roles and
labels first, per §5 - and every locator that still falls back to a CSS id
or class carries a comment explaining why a role/label/testid locator
wasn't available for that specific element (verified against the live
DOM, not assumed).

## Test data and isolation

Every test that needs an account calls `generateNewUser()` and registers
it itself (see `support/apiHelpers.ts#ensureUserRegistered`, which hits
DemoBlaze's `/signup` API directly rather than going through the Sign Up
modal - a precondition, not the behavior under test). Every test that
submits the purchase form calls `buildCheckoutDetails()` for fresh,
synthetic data via `@faker-js/faker`. No test shares a fixed account or a
shared data constant with another test, so the suite is safe to run in any
order, safe to re-run indefinitely against DemoBlaze's shared, persistent
backend, and safe to run fully in parallel (`playwright.config.ts` sets
`fullyParallel: true`) - only `negative.spec.ts`'s own duplicate-signup
test still drives the real Sign Up modal, because signing up is
specifically what that test is checking.

## Traceability to the acceptance criteria

| Acceptance criterion | Spec file | Test |
|---|---|---|
| AC #1 - Guest checkout | `guest-checkout.spec.ts` | "an unauthenticated visitor can browse, add a product, and complete checkout" |
| AC #2 - Authenticated checkout | `authenticated-checkout.spec.ts` | "a logged-in user can log in, add a product, and complete checkout" |
| AC #3 - Invalid login (required) | `negative.spec.ts` | "logging in with credentials that do not exist shows an error alert" |
| AC #3 - Empty checkout form (required) | `negative.spec.ts` | "submitting the purchase form with every field blank is rejected" |
| AC #3 - Additional #1: wrong password | `negative.spec.ts` | "wrong password for an existing account is rejected with the expected alert" |
| AC #3 - Additional #2: no items before checkout | `negative.spec.ts` | "proceeding to checkout with no items in the cart still lets Purchase go through at $0" |
| AC #3 - Additional #3: invalid card format | `negative.spec.ts` | "an invalid (non-numeric) credit card format is still accepted without crashing" |
| AC #3 - Additional #4: duplicate sign-up | `negative.spec.ts` | "signing up with an already-registered username is rejected" |
| Regression (not a listed AC, extra coverage) | `regression.spec.ts` | catalog/category smoke, add-to-cart alert, multi-item cart total, delete recalculates total, purchase empties cart, logout returns to guest state, back-button-during-open-modal recovery, cart persistence across reload/second tab |

## Notable, verified application behavior baked into these tests

These were confirmed by hand against the live site before being encoded as
assertions (not assumed from memory), and some are worth calling out
because they document real gaps or quirks rather than the "ideal" behavior
a reviewer might expect:

- **Checkout validates only Name and Credit card.** Country, City, Month
  and Year are never checked - a purchase with those blank still succeeds.
- **The cart is not required to be non-empty to check out**, and the credit
  card field accepts any string (no format/Luhn validation). Both negative
  tests around this assert the app's *actual* current behavior and call out
  in comments that this is a gap, rather than silently asserting an
  assumed "should reject" behavior that the app doesn't actually implement.
- **Bootstrap 4.0.0-alpha.6's modal transitions are slow and stateful.**
  Reopening a login/signup modal immediately after a prior one closes can
  hit a "Modal is transitioning" error or a silent no-op if attempted
  before Bootstrap's own `hidden.bs.modal` event fires - `HomePage`'s
  `openModal()` waits for that real event rather than a fixed delay.
  See its doc comment for the full, live-verified explanation.
  `CartPage.openCheckout()` waits for the analogous `shown.bs.modal` event
  on `#orderModal` for the same reason: intermittent cross-browser runs
  produced "Please fill out Name and Creditcard." failures against
  Faker-generated data that is never actually empty, matching the
  signature of `checkout.fill()` landing on a still-transitioning modal.
  Unlike the login/signup finding, this one was not independently
  reproduced live (no local WebKit/Firefox access from the environment
  that authored it) - it's the best-supported explanation given the
  finding above, and the failure has not recurred since, but treat it as
  a strong inference rather than a confirmed root cause.
- **The Delete link on a cart row reloads the page.** `js/cart.js`'s
  `deleteItem()` calls `location.reload()` on success, which restarts
  cart.html's async row-population chain for whatever items remain.
- **The cart is tied to a `user` cookie, not to page/tab state.** Verified
  live by inspecting `document.cookie` after adding an item: a reload and a
  second tab opened in the same browser context both see the identical
  cart, which `regression.spec.ts`'s cart-persistence test encodes directly.
- **A modal left open when the browser Back button is pressed does not
  leave stray state behind.** Verified live: Back navigates the whole page
  away (Bootstrap's modal-open state isn't part of browser history here),
  and the page it lands on has no leftover `.modal-backdrop` or
  `modal-open` body class - `regression.spec.ts` asserts this rather than
  assuming it, since a back-forward-cache restore is exactly the kind of
  navigation that could otherwise let that state survive.

## Running locally

```bash
npm install
npm run pw:install   # downloads Chromium, Firefox and WebKit
npm run pw:run        # headless, all three browsers
npm run pw:headed     # headed, for debugging
npm run pw:open        # Playwright UI mode
```

The suite runs against Chromium, Firefox and WebKit (`playwright.config.ts`
`projects`) to catch engine-specific rendering differences - relevant here
given the documented Bootstrap modal-transition quirk below. If you're
updating from an older checkout, re-run `npm run pw:install` to fetch the
Firefox/WebKit binaries; they aren't downloaded until this project list
includes them.

Reporting is multi-format: `list` for live console output while a run is in
progress, `html` (`playwright-report/`, unchanged) for interactive,
trace-linked debugging, and `junit` (`test-results/junit.xml`) so a CI
platform can render native pass/fail summaries without anyone opening the
HTML report.

Copy `.env.example` to `.env` at the repo root to override `BASE_URL` for
a different environment; the suite runs against the public DemoBlaze site
by default with no `.env` required.

> This suite was authored and type-checked (`npx tsc --noEmit -p playwright/tsconfig.json`)
> and verified with `npx playwright test --list` in an environment whose
> network egress could reach GitHub/npm but not demoblaze.com itself, so it
> could not be executed end-to-end there. Every locator and every exact
> alert string below was instead confirmed by hand against the live site.
>
> **Confirmed: all 54 tests passing end-to-end** (18 tests × chromium/
> firefox/webkit), run locally via `npm run pw:run` against the live
> DemoBlaze site on 2026-09-09 - 6 consecutive full runs after the fixes
> below, all 54/54, no repeats of either failure. Getting here from the
> initial cross-browser + fixture refactor took three iterations, kept here
> for anyone auditing this history rather than smoothed over: the first
> full run surfaced two non-Chromium timeouts that turned out to be
> worker-count contention (`workers: 3` fixed that), and a second, separate
> issue - an intermittently blank Name/Credit card field on submit - led to
> the `CartPage.openCheckout()` fix described above. Re-running repeatedly
> after each change, rather than stopping at the first green run, is what
> confirmed which fix addressed which symptom instead of assuming either
> one worked.
