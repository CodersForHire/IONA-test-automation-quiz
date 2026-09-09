# DemoBlaze E2E suite — Ronel Geronimo

Playwright + TypeScript. 35 tests per browser project, covering all three
acceptance criteria, plus accessibility checks with axe.

Every assertion in here was written against behaviour observed on the live site.
Where DemoBlaze's served JavaScript and its actual behaviour disagree, the tests
follow the behaviour and the discrepancy is recorded in the [defect
log](#defect-log).

---

## Quick start

```bash
npm install
npm run pw:install                 # or: npx playwright install chromium firefox webkit

cp .env.example .env               # only needed for the authenticated suite
# fill in DEMOBLAZE_USER / DEMOBLAZE_PASS

npm run test:dev
```

Without a `.env`, 28 of the 35 tests still run; the authenticated suites skip
themselves with a message saying what to set. Nothing fails for a missing file.

---

## Running

### Environments

`TEST_ENV` picks the environment; it is resolved in
[src/utils/env.ts](src/utils/env.ts) from [environments.json](environments.json).
It selects three things at once — the base URL and timeouts, the locator set
under [src/locators/](src/locators), and the data set under
[src/data/](src/data).

| Command | Environment | Retries |
|---|---|---|
| `npm run test:dev` | dev | 0 |
| `npm run test:test` | test | 1 |
| `npm run test:staging` | staging | 2 |

Retries scale with how flaky the environment is legitimately expected to be: none
in dev, where a failure is real; more in staging, where infrastructure wobbles.

**An unset `TEST_ENV` resolves to `test`** — the reference environment, whose
locator and data sets the other two are compile-checked against. A bare
`npx playwright test` and CI, which sets no `TEST_ENV`, therefore both run it.

An unrecognised `TEST_ENV` throws before a single test runs, rather than silently
falling back to the default and testing the wrong host:

```
Error: Unknown TEST_ENV "stagng". Expected one of: dev, test, staging.
```

DemoBlaze is a single public deployment, so all three environments currently
point at the same host. The mechanism is the point: `BASE_URL` overrides the
resolved URL, so pointing the suite at a private deployment is one variable, not
a code change.

```bash
BASE_URL=https://my-demoblaze-clone.example npm run test:staging
```

### Browsers

```bash
npx playwright test --project=firefox
npm run test:all-browsers          # chromium + firefox + webkit
```

The full suite passes on all three. Nothing in the tests is browser-conditional.

### Suites

The specs are split into two folders by what they cover, and a tier is selected
by tag:

```bash
npm run test:smoke                 # @smoke            —  5 tests, the critical paths
npm run test:e2e                   # tests/e2e         —  6 tests, the cart journeys (also @e2e)
npm run test:regression            # tests/            — 35 tests, everything
npm run test:regression-only       # tests/regression  — 29 tests, without the cart journeys
npm run test:a11y                  # @a11y             —  3 accessibility checks
```

Regression means the whole suite and smoke is a subset of it, so **tags** select
the tier and folders only group the specs by subject. Every test runs exactly
once per run; nothing is executed twice.

```bash
npx playwright test --grep @smoke        # 5
npx playwright test --grep @e2e          # 6
npx playwright test --grep @regression   # 35
```

Tags are declared with Playwright's native `{ tag: [...] }`, and for the
data-driven suites they come from the JSON row. Promoting a case into smoke is
therefore a tag edit in the JSON, with no TypeScript touched.

### How a suite is built

Each spec file is self-contained: it reads its data file, loops its cases, and
contains the test steps in full. Opening
`tests/regression/guest-checkout.spec.ts` shows the whole journey, and the
reporter names that file as the test's source.

```typescript
// tests/regression/guest-checkout.spec.ts
const cases = loadCases<CheckoutCase>(data);
```

### Other

```bash
npm run typecheck                  # tsc --noEmit
npm run test:report                # open the last HTML report
```

---

## Acceptance criteria

| Criterion | Covered by | Tests |
|---|---|---|
| 1. Full purchase journey, not logged in | [3](tests/regression/guest-checkout.spec.ts) + [2](tests/e2e/guest-scenarios.spec.ts) | 5 |
| 2. Log in with valid credentials | [1](tests/regression/login-positive.spec.ts) | 1 |
| 2. Log out | [1](tests/regression/logout.spec.ts) | 1 |
| 2. Full purchase journey, authenticated | [2](tests/regression/auth-checkout.spec.ts) + [2](tests/e2e/user-scenarios.spec.ts) | 4 |
| 3. Invalid login and sign-up | [8](tests/regression/login-negative.spec.ts) | 8 |
| 3. Empty checkout form + further negatives | [7](tests/regression/checkout-negative.spec.ts) + [1](tests/e2e/guest-scenarios.spec.ts) + [1](tests/e2e/user-scenarios.spec.ts) | 9 |
| 3. Place Order form state | [4](tests/regression/order-modal.spec.ts) | 4 |
| Accessibility (axe) | [3](tests/regression/accessibility.spec.ts) | 3 |

Per-test detail — preconditions, numbered steps, expected results and the data
each case runs on — is in [TEST-CASES.md](TEST-CASES.md).

Criterion 3 asks for five negative scenarios; there are twenty.

**Invalid login and sign-up (8)** — unknown username · empty username and
password · username with no password · password with no username · a real
account given the wrong password · sign-up with both fields empty · sign-up for a
username already taken · sign-up for a username padded with spaces.

**Invalid checkout (8)** — empty form · name but no card · card but no name ·
malformed card, month 13 and a past year · a name and card of nothing but
spaces · no address and no expiry date · order placed with a cart that was never
filled · order placed with a six-item cart that was emptied by hand.

Six of these are negatives the application **does not refuse**. They assert what
it actually does and carry a defect id, so the suite reports the bug without
going red for it — and turns red the day it is fixed:

| Case | Defect |
|---|---|
| accepts a malformed credit card, expiry month and expiry year | DB-001 |
| accepts an order placed with an empty cart · both emptied-cart journeys | DB-002 |
| accepts a whitespace-only name and credit card | DB-006 |
| keeps the entered details after the form is dismissed and reopened | DB-007 |
| accepts an order with no address and no expiry date | DB-008 |
| accepts a sign-up for a username padded with spaces | DB-009 |

**Place Order form state (4)** — opens empty and shows the cart total · keeps
every detail entered when an order is refused · dismisses without placing an
order · keeps the card details after being dismissed and reopened. These read the
form back rather than only submitting it, which is what catches a form that
opened pre-filled or lost the address on a refusal.

### Cart management

Three journeys that exercise the cart itself rather than the checkout form, each
run twice — once as a guest and once signed in. Six tests, in two files split by
FIXTURE, not by tier:

- [tests/e2e/guest-scenarios.spec.ts](tests/e2e/guest-scenarios.spec.ts) — imports `test` from `fixtures/page-manager.fixture.ts`
- [tests/e2e/user-scenarios.spec.ts](tests/e2e/user-scenarios.spec.ts) — imports `test` from `fixtures/auth.fixture.ts`

| # | Journey | Criterion |
|---|---|---|
| 1 | Buy a phone, filling every field of the checkout form | 1 (guest) / 2 (signed in) |
| 2 | Add a phone and two laptops, remove the phone and one laptop, buy the laptop left | 1 / 2 |
| 3 | Add a phone, two laptops and three monitors, remove all six, order anyway | 3 |

Running each journey on both sides is not the same test twice. DemoBlaze stores a
guest cart against an anonymous cookie and a member cart against the account,
through two different branches of `addToCart()`, so the two files exercise
different server-side paths. DB-004 is the visible edge of that split: the same
click alerts `"Product added"` as a guest and `"Product added."` signed in, and
each file pins its own spelling.

The two files hold the journey bodies in full rather than sharing them. That is
the same trade described in [How a suite is built](#how-a-suite-is-built) — a
spec that reads top to bottom on its own, at the cost of the two copies having
to be changed together.

Journey 2 is where the removals are checked in both directions — what went, and
what stayed — and where the cart total is the real assertion: it is recalculated
from the basket the backend still holds, so it fails if a delete reached the
table but not the server.

Journey 3 asks for three monitors and DemoBlaze sells two, so `ASUS Full HD` is
added twice. That duplicate is the reason the cart is emptied by row position
rather than by title, and it is asserted directly — the cart is checked to hold
two rows of that title before anything is removed. The journey ends in the
DB-002 defect below, reached by a different route than the existing empty-cart
case: a basket verified to hold six items, then verified to hold none, and the
order still taken. Running it signed in as well shows the order is accepted even
when it is posted with a session token against an account cart.

The signed-in file shares one account per worker across its three tests, so the
auth fixture's cart cleanup either side of every test is what keeps them
independent — two of the three deliberately leave items in the basket mid-run.

---

## Layout

```
playwright/ronelgeronimo/
├── environments.json  Base URL and timeouts per TEST_ENV
├── src/
│   ├── data/          JSON test data — one file per suite, one folder per
│   │                  environment (dev/, test/, staging/); index.ts serves
│   │                  the set for TEST_ENV
│   ├── locators/      Every selector, as data — one folder per environment,
│   │                  each with one file per page object under pages/ and the
│   │                  shared ones in component.locators.ts; index.ts selects
│   │                  the set for TEST_ENV
│   ├── pages/         Page objects: home, product, cart
│   ├── components/    Modals and nav — reused across pages
│   ├── fixtures/      page-manager.fixture.ts (page objects),
│   │                  auth.fixture.ts (sign-in),
│   │                  spec-kit.ts (the rest of the spec surface)
│   └── utils/         env, dates, dialogs, axe, API helpers, message constants,
│                      locators.ts (resolves a spec into a Playwright locator)
└── tests/             The specs — each one holds its own steps
    ├── e2e/             the three cart-management journeys, guest and
    │                    signed in — 6 tests
    └── regression/      login, logout, checkout, negatives and
                         accessibility — 29 tests
```

Everything the specs import lives under `src/`; `tests/` holds only specs. A
spec reaches its helpers as `../../src/...`, which is the one import shape in
the suite.

### Page objects assert nothing

They expose actions and state and return the next page object when a navigation
happens; every assertion lives in the spec, where the failure message points at
intent. Locators are `readonly` fields built in the constructor, so they are
resolved lazily on use rather than captured before the page has the element.

### Fixtures

Specs import `test` and `expect` from
[fixtures/page-manager.fixture.ts](src/fixtures/page-manager.fixture.ts), never
from `@playwright/test`, and receive a single fixture — `pm`, the `PageManager`
the file is named for. It is the one entry point to every page object and
component, so no spec imports a page object or calls `new HomePage(page)`:

```typescript
test('buys a laptop', async ({ pm }) => {
  await pm.homePage.open();
  await pm.cartPage.open();
  await expect(pm.cartPage.productRows).toHaveCount(1);
});
```

The manager is lazy: nothing is constructed until a getter is first read, and
each class is then built once per test and cached, so a spec that only touches
the cart never builds the login modal. Adding a page object to the framework
means adding a getter there — no spec signature changes.

[fixtures/auth.fixture.ts](src/fixtures/auth.fixture.ts) extends this `test`, so the
authenticated suite gets the same `pm` alongside its saved session.

### One import per spec

`pm` removes the page-object imports; [spec-kit.ts](src/fixtures/spec-kit.ts) removes
the rest. It re-exports the non-page-object spec surface — `loadCase`/`loadCases`,
`ALERT` and `ORDER_CONFIRMATION_TITLE`, `uniqueUsername`, the case types — and both
fixture modules re-export it, so a spec imports its dataset and its fixture and
nothing else:

```typescript
import { cartManagement as data } from '../../src/data';
import { ALERT, expect, loadCase, test, type SinglePurchaseCase }
  from '../../src/fixtures/page-manager.fixture';
```

The dataset comes from [data/index.ts](src/data/index.ts) rather than a JSON path,
so no spec knows — or can know — which environment's copy it was handed.

The gain is not the line count: a spec no longer has to know which util file a
helper lives in, so moving `loadCase` or renaming `utils/messages` touches one
file instead of every test. The single exception is
[utils/a11y.ts](src/utils/a11y.ts) — only the accessibility spec uses it, and
routing it through the barrel would pull `@axe-core/playwright` into the module
graph of every spec in every worker, so that one spec imports it directly.

### Locators

**Page objects contain no selectors.** Every locator in the suite is declared as
data and turned into a Playwright locator by
[utils/locators.ts](src/utils/locators.ts).

Each page object has its own locator file under its environment's `pages/` —
[test/pages/cart.locators.ts](src/locators/test/pages/cart.locators.ts) is what
cart.page.ts reads on `TEST_ENV=test`, and nothing else does:

```typescript
export const CART_PAGE_LOCATORS = {
  table: { role: 'table' },
  productRows: { role: 'row', has: { role: 'link', name: 'Delete' } },
  total: { css: '#totalp' },                        // written into a bare <h3>
  placeOrderButton: { role: 'button', name: 'Place Order' },
} as const satisfies LocatorGroup;
```

The shared components — the nav bar, the three modals, the confirmation overlay
— belong to no single page, so they share one file per environment,
[test/component.locators.ts](src/locators/test/component.locators.ts), a named
group apiece. Each environment's [index.ts](src/locators/test/index.ts) writes no
selector of its own; it only names the groups, so that one map exists per
environment for [locators/index.ts](src/locators/index.ts) to select from. Adding
a page object is a file under `pages/` and a line in that barrel, in each
environment folder.

```typescript
this.table = resolve(page, L.table);
this.productRows = resolve(this.table, L.productRows);
```

Parameterised locators stay data too — `{ role: 'link', name: '{{title}}' }`,
filled by `resolve(page, L.productLink, { title })`. A missing parameter throws
with the placeholder's name rather than timing out on an element that was never
going to match.

Strategy is unchanged: role and accessible name first, `label` next, and `css`
only where the markup makes role-based addressing genuinely ambiguous — each of
those carrying the reason. Two examples, both real:

- The three category links **all share `id="itemc"`**, which is exactly why the
  suite addresses them as `getByRole('link', { name: 'Laptops' })`.
- The order modal has **two labels with `for="name"`** — the total line and the
  field label — so `getByLabel('Name:')` is ambiguous by construction and `#name`
  is used instead.

No XPath, no styling-class selectors, no `page.$()`, and no `waitForTimeout`
anywhere in the suite.

#### Locators per environment

This is why the locators are data. When one environment serves different markup
— an older build on staging, a feature flag that renames a button, a test host
that ships `data-testid` attributes the public site does not — the change is an
edit inside that environment's folder, keyed by the same `TEST_ENV` that picks
the base URL:

```
src/locators/
├── locator.types.ts          the shared spec vocabulary
├── dev/      component.locators.ts + pages/ + index.ts → DEV_LOCATORS
├── test/     component.locators.ts + pages/ + index.ts → TEST_LOCATORS
├── staging/  component.locators.ts + pages/ + index.ts → STAGING_LOCATORS
└── index.ts  LOCATORS = LOCATOR_SETS[ENV]
```

Each environment owns a **complete** set rather than a set of deltas, so staging
can change `placeOrderButton` to `{ role: 'button', name: 'Checkout' }` and
`total` to `{ testId: 'cart-total' }` without any base set constraining it. No
page object changes and no spec changes: they read the merged `LOCATORS` from
[locators/index.ts](src/locators/index.ts) and never import an environment folder
directly.

The cost of full copies is drift — an element renamed in one environment and
forgotten in another. That is why `locators/index.ts` annotates the three sets as
`Record<EnvName, Locators>`, with `Locators` derived from `TEST_LOCATORS`:

```typescript
export type Locators = {
  [Group in keyof typeof TEST_LOCATORS]: Record<keyof (typeof TEST_LOCATORS)[Group], LocatorSpec>;
};
```

`test` is therefore the reference set, and a group or element present there and
missing from `dev` or `staging` is a **build error**, naming the environment and
the element — not a locator that silently never matches. The value type stays
widened to `LocatorSpec`, so one environment may address by test id what another
addresses by role. What the compiler cannot catch is the same key holding a stale
selector; until a real difference exists, edit `test/` and re-copy.

DemoBlaze is a single public deployment, so all three environments serve
identical markup today and the three sets are identical copies. The mechanism is
the point, exactly as it is for `BASE_URL`.

### Native dialogs

DemoBlaze reports nearly everything through `window.alert()`. All of it goes
through [utils/dialogs.ts](src/utils/dialogs.ts), which registers the handler
*before* the action and accepts immediately — an `alert()` raised synchronously
inside a click handler blocks the page, so a click cannot settle until the dialog
is gone. Page objects return the message; specs assert on it.

### Deleting cart rows

`cart.js` deletes over AJAX and then calls `location.reload()`, which makes the
obvious wait the wrong one. Waiting for the clicked row to detach looks like it
proves the delete landed, and does not: a reload detaches *every* row for an
instant, so the wait can be satisfied by the reload rather than by the deletion.
The next click is then issued against a document that is about to be discarded,
the click is lost, and one item silently survives — an intermittent failure, seen
on webkit under load before it was designed out.

The only trustworthy signal is the cart coming back one row shorter — a count
cannot be satisfied mid-reload, because a page mid-reload has no rows at all.

`removeProduct()` carries that wait itself: it reads the row count, clicks, and
returns once the cart has settled one row shorter. Specs delete and move on.

```typescript
for (const title of toRemove) {
  await cartPage.removeProduct(title);
}
```

`removeLastProduct()` stays a bare action, because emptying a cart already
counts down in the spec that drives it:

```typescript
for (let remaining = added.length; remaining > 0; remaining -= 1) {
  await cartPage.removeLastProduct();
  await expect(cartPage.productRows).toHaveCount(remaining - 1);
}
```

Either way the retrying expectation spans the reload, so it cannot pass until the
row is genuinely gone. Nothing sleeps.

### Opening the catalogue

`HomePage.open()` waits for the first product card, not just for the CATEGORIES
heading. The heading is part of the page **shell** and is there long before the
products are — `index.js` fetches those separately — so returning on it hands
back a page whose product request is still in flight.

That is not merely early, it is wrong. A `selectCategory()` that follows clears
`#tbodyid` and appends its own results, and then the late full-catalogue response
appends on top of them. The grid ends up holding a category's products *and* the
whole catalogue, so any product in both appears **twice**, every by-name locator
becomes ambiguous, and the test fails as a strict mode violation — intermittently
and only under load:

```
strict mode violation: getByRole('link', { name: 'Sony vaio i5', exact: true })
resolved to 2 elements
```

One card is enough of a gate: the products arrive in a single response and are
appended in one callback, so the first card existing means the whole batch has
landed. Waiting for a count instead would tie the page object to how many
products the catalogue happens to hold.

---

## Authentication

One sign-in per **worker**, not per test. The worker signs in through the real UI
once, `storageState` captures the `tokenp_` cookie, and every test in that worker
starts from it with its own fresh browser context. A run of N authenticated tests
performs one login while the tests stay independent.

Session reuse would otherwise mean the login form is never exercised by a spec,
so one test opts out of it:
[tests/regression/login-positive.spec.ts](tests/regression/login-positive.spec.ts)
sets `test.use({ storageState: { cookies: [], origins: [] } })`, starts signed
out, signs in the long way and asserts the result — including that the session
survives a reload, which is what the saved state relies on.

It still takes its account from the auth fixture's `testUser`. That is why
`auth.fixture.ts` registers the account in `workerUser` rather than alongside the
sign-in: the account exists for every test that needs one, including the test
that deliberately starts from no saved session.

### An account per worker

DemoBlaze returns **the same token for every login by a given user**, and stores
the cart against the user rather than the session. Two workers signed in as one
account therefore share a cart, and one test's purchase empties another's basket
mid-flight — which is precisely what happened when the suite was first run across
three browser projects.

Each worker is given its own account instead, named from the `.env` user:
`<DEMOBLAZE_USER>_w0`, `_w1`, and so on. The names are deterministic, so repeated
runs reuse the same handful of accounts rather than littering the demo with new
ones, and registration is idempotent — "This user already exist." is treated as
success.

Carts are emptied through the API before *and* after every authenticated test, so
a run also recovers from whatever a crashed earlier run left behind. That uses
`/viewcart` + `/deleteitem` rather than `/deletecart`, because DemoBlaze calls
`/deletecart` with the *username* while items are stored against the token.

`.auth/` holds saved session state. It is gitignored and should be treated as a
credential file: it grants what a stolen session cookie grants.

---

## Test data

Every suite is driven by a JSON file in [data/](src/data/), imported by name from
[data/index.ts](src/data/index.ts), loaded through `loadCases<T>()` in
[utils/data.ts](src/utils/data.ts) and typed by
[utils/types.ts](src/utils/types.ts), so a malformed row is a compile error rather
than a confusing runtime failure. Adding a case is a JSON edit.

### Data per environment

Data follows the same rule as the locators: one folder per environment, each
holding a **complete** copy of all six files.

```
src/data/
├── dev/      accessibility.json, auth-checkout.json, cart-management.json, …
├── test/     the same six
├── staging/  the same six
└── index.ts  named exports for TEST_ENV
```

`index.ts` imports all eighteen files statically and exports the six for the
current `ENV`. Static imports are the point: reading a path built from `ENV` at
run time would work, but would type every dataset as `any` and give up the
compile-time check that makes the row types worth having. The sets are pinned
with `satisfies Record<EnvName, DataSet>`, so a file missing from one environment
is a build error — the data-side twin of the locator layer's guard.

That lets staging carry a different product catalogue, or a fixed build carry a
smaller accessibility baseline, without a spec changing. DemoBlaze serves one
deployment, so the three sets are identical copies today.

[data/test/cart-management.json](src/data/test/cart-management.json) is the one
exception to the row shape. Its three journeys have different baskets and different endings,
so they are named objects loaded with `loadCase()` rather than rows loaded with
`loadCases()` — a shared row type would have to be the union of three unrelated
shapes, which is a worse description of the data than three types. Each is one
test rather than a row run many times, so its title and tags are written at the
`test()` call in the spec and the JSON holds only the values the journey acts
on. What survives journey 2's removals is derived from `add` minus `remove`
rather than listed, so the data cannot claim to keep something it also removes.

No test depends on another's output or on a shared account someone else could
change. The login negatives that need a real account register a throwaway one
first; the "unknown username" row generates a name that cannot exist.

### Dynamic dates

Hard-coded dates rot. A card expiry of `"2027"` is a valid future date today and
a silently expired one later; a negative case that means "an expiry year in the
past" and says `"1999"` stops demonstrating that clearly as the years pass.

Dates are written as tokens and expanded against the clock at run time by
[utils/dates.ts](src/utils/dates.ts), so the data files stay honest without anyone
maintaining them:

```json
{ "card": "4111111111111111", "month": "{{month}}",  "year": "{{year+2}}" }
{ "card": "not-a-card-!!",    "month": "13",         "year": "{{year-5}}" }
```

The first is always a card that has not expired; the second is always one that
has. `month` stays literal at `13` there, because that is an invalid *value*
rather than a date.

Grammar is `{{name[±n][:FORMAT]}}`:

| Token | Result on 9 Sep 2026 | |
|---|---|---|
| `{{today}}` | `2026-09-09` | default format |
| `{{today:DD/MM/YYYY}}` | `09/09/2026` | `YYYY YY MMM MM M DD D HH mm ss` |
| `{{today+30}}` | `2026-10-09` | `n` is days |
| `{{month}}` / `{{month+4}}` | `09` / `01` | `n` is months, clamped at month ends |
| `{{year+3}}` / `{{year-5}}` | `2029` / `2021` | `n` is years |
| `{{timestamp}}` | `m0k3z1qf4b` | unique per call |

Expansion walks the whole structure, so no spec needs to know a case carries a
relative date, and one `now` is used per file so a case cannot straddle midnight
halfway through its own data. Tokens the utility does not own — such as
`{{unknownUser}}` in [data/test/login-negative.json](src/data/test/login-negative.json) — pass
through untouched.

The same module backs `uniqueUsername()`, which is what keeps two parallel
workers from registering the same DemoBlaze account.

---

## Accessibility

`AxeBuilder` with `wcag2a` + `wcag2aa`, on the homepage, a product page and the
cart.

DemoBlaze has genuine, long-standing violations, so "zero violations" would be a
permanently red test nobody looks at. Each page instead carries a **baseline** of
the rule ids it currently breaks, each with the reason it is tolerated, and the
assertion is that the set has not changed:

- a **new** rule id fails — something regressed
- a **disappeared** rule id also fails — something was fixed, and the baseline
  must shrink

That second half is what stops a baseline decaying into a permanent allow-list.
Current baseline: `image-alt` on all three pages, plus `color-contrast` on the
product page and cart, and `link-name` on the product page.

---

## Defect log

Found while building the suite. The tests assert what the application **actually
does**, so the suite reports these without going red for a fault it did not
cause. Each entry says what should happen instead and which assertion to flip
when it is fixed.

| Id | Severity | What happens | What should happen |
|---|---|---|---|
| **DB-001** | High | The checkout accepts `not-a-card-!!` as a credit card, `13` as an expiry month and `1999` as an expiry year. `purchaseOrder()` only checks that name and card are non-empty. | Reject non-numeric cards, months outside 1–12, and past expiry years. |
| **DB-002** | High | An order can be placed and confirmed with **nothing in the cart** — whether the cart was never filled, or filled with six items and then emptied. | Disable *Place Order* on an empty cart, or refuse the order. |
| **DB-003** | Medium | After a successful sign-up, no modal will reopen until the page is reloaded — clicking *Sign up* or *Log in* does nothing. Reproducible. | Registering should leave the page usable; a user should be able to sign in straight away. |
| **DB-004** | Low | The add-to-cart alert is inconsistent: `"Product added"` as a guest, `"Product added."` when signed in. Two branches of `addToCart()` disagree about the full stop. | One message. |
| **DB-005** | Medium (a11y) | Login and sign-up labels point at ids that do not exist — `<label for="log-name">` above `<input id="loginusername">` — so the fields have **no accessible label**. Screen readers announce an unlabelled text box. | `for` should match the input's id. |
| **DB-006** | High | The checkout accepts a single **space** as the name and as the credit card. `purchaseOrder()` checks the fields are non-empty strings, which `"   "` satisfies, and the confirmation comes back with an empty `Name:` and an empty `Card Number:` — an order nobody can be billed for or shipped to. | Reject a name or card that is blank once trimmed. |
| **DB-007** | Medium | The Place Order form is **never reset**. Dismissing it with *Close* and reopening it shows the previous attempt in full, the credit card number included, and those values are submitted with the next order unless they are typed over. | Clear the form when it is dismissed, so a card number does not outlive the order it was typed for. |
| **DB-008** | Medium | The checkout accepts an order with **no address and no expiry date** — country, city, month and year all left blank. `purchaseOrder()` validates name and card only, so the other four fields are decorative. | Require an expiry date to authorise the card, and an address to ship to. |
| **DB-009** | Medium | Sign-up stores the username **untrimmed**. Registering `"  bob  "` succeeds and creates an account that `"bob"` cannot sign in to — the two are different users. The extreme case registers cleanly too: an account named with nothing but spaces exists on the public demo. | Trim the username, or refuse one that is blank once trimmed. |

Two further observations that are arguably intended behaviour rather than
defects, recorded because the tests had to account for them:

- Confirming the order dialog does **not** return to the homepage, although the
  served `cart.js` contains `location.href = 'index.html'` for that click. The
  suite asserts the dialog closes, then reloads the cart to verify it is empty.
- The cart page is not re-rendered underneath the confirmation, so purchased rows
  stay on screen until the page is loaded again. The cart is genuinely cleared
  server-side.

DB-005 is not caught by the axe checks, because the modals are closed when axe
runs — see [Not covered](#not-covered).

---

## Not covered

Deliberate scope decisions, listed so they read as choices rather than gaps.

- **axe does not scan open modals.** The three accessibility tests scan pages at
  rest, so DB-005 was found by reading markup, not by axe. The natural next step
  is a case that opens the login modal and scans it.
- **CI runs chromium only.** `.github/workflows/playwright-tests.yml` installs a
  single browser and has no `DEMOBLAZE_USER` secret, so on CI the authenticated
  suite would skip. Making CI match local runs means installing all three
  browsers and adding two repository secrets. The workflow is shared assessment
  infrastructure, so I have not modified it.
- **The negative suites register accounts on the public demo** — two per run, plus
  one per worker for the authenticated suite. Unavoidable without a private
  deployment, and preferable to depending on a shared account that anyone can
  change.
