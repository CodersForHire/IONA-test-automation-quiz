# DemoBlaze checkout automation — Playwright + TypeScript

End-to-end coverage of the three acceptance criteria in the
[assessment README](../../README.md#acceptance-criteria), plus the minimum
regression tests the brief asks for, around the pieces those flows depend on.

## Running

```bash
npm run pw:run                             # everything, headless
npm run pw:headed                          # watch the browser
npm run pw:open                            # Playwright UI mode (step through, time-travel)
npx playwright test --grep "@AC-3"         # one acceptance criterion (quotes needed on PowerShell)
npx playwright test --grep "@regression"   # minimum regression tests only
npx playwright show-report                 # HTML report of the last run
```

Every test is tagged: `@AC-1`, `@AC-2`, `@AC-3`, `@regression`, `@smoke`,
`@negative`, `@known-defect`.

No manual setup is needed. The logged-in flows use an account the suite
provisions itself through DemoBlaze's `/signup` API (idempotent — re-runs
are fine). One account per parallel worker, so workers never share a cart.

## Layout

```
resevelleBetonio/
├── checkout.spec.ts             AC-1 guest checkout, AC-2 logged-in checkout
├── negative.spec.ts             AC-3 invalid input handling
├── minimum-regression.spec.ts   catalogue, cart maths, session
├── pages/                       page objects (one per page/modal; locators + actions, no assertions)
├── support/
│   ├── fixtures.ts              custom `test` exposing page objects, dialog capture, test user
│   ├── auth.ts                  API-level signup / login (mirrors the site's own JS)
│   ├── dialogs.ts               captures native alert() messages for assertion
│   └── timeouts.ts              headroom for the (slow) public demo API
└── test-data/                   products, checkout form data, credentials — nothing inlined in specs
```

## Traceability

| Acceptance criterion | Test | File |
|---|---|---|
| **AC-1** Guest: navigate home → pick a product from a category → add to cart → checkout form → success confirmation | `guest can complete a full purchase journey without logging in` — each AC bullet is a `test.step` | `checkout.spec.ts` |
| **AC-2** Logged in: valid login → product → cart → checkout form → success confirmation | `authenticated user can complete a full purchase journey` — also asserts the confirmation amount equals the product price | `checkout.spec.ts` |
| **AC-3** Invalid login, assert the error alert | `rejects login with wrong password for an existing user` / `…username that was never registered` / `…both fields left empty` | `negative.spec.ts` |
| **AC-3** Empty checkout form, assert the validation/browser behaviour | `rejects a completely empty checkout form` (native alert `Please fill out Name and Creditcard.`, modal stays open, no confirmation) | `negative.spec.ts` |
| **AC-3** ≥3 additional negative scenarios | `rejects checkout with name filled but credit card missing`, `…credit card filled but name missing`, `rejects a credit card in an invalid format` †, `rejects placing an order when the cart is empty` † | `negative.spec.ts` |
| Minimum regression tests (brief: "Include regression test cases") | category filter, product name/price ×3, cart totals, cart row deletion, purchase empties cart, logout | `minimum-regression.spec.ts` |

† Marked `test.fail()` — see *Defects found* below. They assert the expected
behaviour, are reported as "expected failures" (suite stays green), and will
flip to a real failure the day DemoBlaze fixes the validation.

## Design notes

- **Locators** — stable ids where DemoBlaze provides them (`#loginusername`,
  `#tbodyid`, `#totalp`, …), accessible role + name elsewhere. Product tiles
  and category links have no usable ids (see quirks), so those go by visible text.
- **Deterministic waits, no sleeps** — where the UI can't tell us the data is
  in (`networkidle` never settles on this site), the page objects wait on the
  exact backend call the site makes (`/bycat`, `/viewcart`, `/addtocart`),
  traced from the site's own `js/*.js`.
- **Native alerts** — DemoBlaze reports most outcomes via `window.alert`. A
  fixture captures every alert's text so tests assert on the exact message.
- **Test data lives in `test-data/`**, typed, with valid and invalid sets side
  by side. Credentials are synthetic and provisioned on demand.
- **Login via the API** for tests that need a session but aren't about the
  login modal (minimum regression tests, empty-cart case); AC-2 drives the real modal.

## Site quirks that shaped the tests

| Finding | Evidence | Consequence for the tests |
|---|---|---|
| **Guest cart is one shared, global table.** As a guest, `addToCart`/`viewcart` are called with `flag: false` and the raw `document.cookie`, and the backend doesn't scope by it. | `js/prod.js`, `js/cart.js`; watched the cart climb 0 → 155 rows mid-test from other visitors' activity | AC-1 never assumes an empty cart and tracks its own item by the id it sent in `/addtocart`. Cart clearing is only done for the logged-in (per-account) cart. |
| Cart rows render one `POST /view` at a time after `/viewcart`. | `js/cart.js` | "Cart loaded" = row count equals `/viewcart`'s `Items.length`; otherwise an early count can read 0. |
| All three category links share `id="itemc"`; product tiles have no id. | `index.html`, `js/index.js` | Category/product selection by accessible name, never by id. |
| Order confirmation is a SweetAlert that only accepts the OK click once its `visible` class is set; earlier clicks dismiss without confirming. | observed | `dismissConfirmation()` gates on that class. |
| Public backend (`api.demoblaze.com`) intermittently stalls — traced DNS 4.7 s, connect 5 s, calls never answered. | trace of a failing run | Per-file `retries: 2` and a 60 s test budget, so a stall isn't reported as a product failure. |

## Defects found

| # | Defect | Where | Covered by |
|---|---|---|---|
| 1 | Credit card accepts any non-empty string (`ABCD-not-a-card!!` produces a confirmation). | `purchaseOrder()` in `js/cart.js` checks only for empty | `rejects a credit card in an invalid format` (`test.fail`) |
| 2 | An empty cart can be "purchased" — confirmation for `Amount: 0 USD`. | same | `rejects placing an order when the cart is empty` (`test.fail`) |
| 3 | Country, city, month and year are never validated. | same | noted; not asserted separately (same root cause as #1) |
| 4 | Confirmation date shows the month zero-indexed (11 Sep prints as `11/8/2026`). | `date.getMonth()` without `+1` | noted |
| 5 | Guest cart is shared across all anonymous visitors (see quirks). | backend scoping | noted |
