# Test cases — DemoBlaze suite

Manual test-case documentation for the 35 automated tests in
[playwright/ronelgeronimo/tests](tests). Every case below is automated; there are
no manual-only cases. Each case is written so that a person could execute it by
hand against the application and reach the same verdict the automation reaches.

**Application under test:** [https://www.demoblaze.com](https://www.demoblaze.com)
(public demo store — Phones, Laptops, Monitors, cart, checkout).

For setup, environments, architecture and the defect log, see
[README.md](README.md). This file covers only *what each test does*.

---

## How to read a case

| Field | Meaning |
|---|---|
| **ID** | `TC-<AREA>-<nn>`. Stable; referenced from the traceability matrix below. |
| **Heading** | The literal `test()` title, so a case can be found in the HTML report or run with `--grep`. |
| **Tags** | `@smoke` critical path · `@e2e` cart journeys · `@regression` full suite · `@a11y` accessibility. |
| **Spec** | The file that automates it, relative to [tests](tests). |
| **Data** | The JSON row that drives it, relative to [src/data](src/data). Hand-written cases say *inline*. |

### Standing preconditions

These hold for every case and are not repeated:

- A fresh browser context per test — no cookies, no cache, no cart carried in.
- The catalogue is reached from the home page (`/index.html`) each time.
- **Guest cases** additionally assert nobody is signed in before acting.
- **Signed-in cases** start from a session saved once per worker
  (`storageState`), for the account `<DEMOBLAZE_USER>_w<worker index>`; the
  account's cart is emptied over the API before *and* after each test.

### Two spellings of one alert

Adding to the cart alerts **`Product added`** as a guest and **`Product added.`**
— with a full stop — when signed in. That is defect DB-004, and each case pins
the spelling matching its own session state. It is not a typo in this document.

### Dates in test data

`{{month}}`, `{{year+2}}` and similar are expanded when the test loads, so the
cards never quietly expire. Expected values below use the same notation:
`<year+2>` means "the current year plus two".

### Test data shown here is the `test` environment

`src/data/dev/`, `src/data/test/` and `src/data/staging/` are identical today,
so the values below apply to all three. That is not guaranteed to stay true —
`src/data/<TEST_ENV>/` is the authority.

---

## Traceability

| Acceptance criterion | Case IDs | Tests |
|---|---|---|
| 1. Full purchase journey, not logged in | `TC-GCO-01` … `TC-GCO-03`, `TC-EGS-01`, `TC-EGS-02` | 5 |
| 2. Log in with valid credentials | `TC-LGP-01` | 1 |
| 2. Log out | `TC-LGO-01` | 1 |
| 2. Full purchase journey, authenticated | `TC-ACO-01`, `TC-ACO-02`, `TC-EUS-01`, `TC-EUS-02` | 4 |
| 3. Invalid login and sign-up | `TC-LGN-01` … `TC-LGN-08` | 8 |
| 3. Invalid checkout | `TC-CKN-01` … `TC-CKN-07`, `TC-EGS-03`, `TC-EUS-03` | 9 |
| 3. Place Order form state | `TC-OMF-01` … `TC-OMF-04` | 4 |
| Accessibility (axe) | `TC-A11Y-01` … `TC-A11Y-03` | 3 |
| | **Total** | **35** |

A bare `npx playwright test` reports 36 per browser: the extra one is
`playwright/tests/sample.spec.ts`, the repo's stock scaffolding, which is not
part of this suite.

### Which command runs what

| Command | Cases | Count |
|---|---|---|
| `npm run test:smoke` | `TC-GCO-01`, `TC-ACO-01`, `TC-LGP-01`, `TC-LGN-01`, `TC-CKN-01` | 5 |
| `npm run test:e2e` | `TC-EGS-*`, `TC-EUS-*` | 6 |
| `npm run test:regression-only` | `TC-GCO-*`, `TC-ACO-*`, `TC-LGP-*`, `TC-LGO-*`, `TC-LGN-*`, `TC-CKN-*`, `TC-OMF-*`, `TC-A11Y-*` | 29 |
| `npm run test:regression` | everything | 35 |
| `npm run test:a11y` | `TC-A11Y-*` | 3 |

---

## TC-GCO — Guest checkout

**Spec:** [regression/guest-checkout.spec.ts](tests/regression/guest-checkout.spec.ts) ·
**Data:** [guest-checkout.json](src/data/test/guest-checkout.json) ·
**Describe:** `Guest checkout`

One case per product category. All three run the same steps against different
data, so the steps are given once and the data follows.

**Preconditions:** not signed in; empty cart.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The **CATEGORIES** heading is visible |
| 2 | Check the navbar | **Log in** is visible; no welcome greeting is shown |
| 3 | Click the category link | The product's link appears in the catalogue |
| 4 | Click the product link | The product page opens and its title reads exactly the product name |
| 5 | Read the price shown on the product page | A numeric price is parsed from the price line — call it **P** |
| 6 | Click **Add to cart** | A browser alert reads `Product added` |
| 7 | Open `/cart.html` | A row for the product is visible; the cart holds exactly **1** row; the cart total reads **P** |
| 8 | Click **Place Order** | The Place Order form opens with a **Purchase** button |
| 9 | Fill Name, Country, City, Credit card, Month, Year | The fields accept the values |
| 10 | Click **Purchase** | A confirmation dialog headed `Thank you for your purchase!` appears |
| 11 | Read the confirmation body | It contains `Amount: P USD`, `Name: <name>` and `Card Number: <card>` |
| 12 | Read the confirmation's `Id` and `Date` lines | `Id` is a number; `Date` reads as `M/D/YYYY` and is within a day of today (see note below) |
| 13 | Click **OK** | The confirmation dialog closes |
| 14 | Reload `/cart.html` | The cart holds **0** rows |

Step 12 is checked here and nowhere else — `Id` and `Date` are the only two
lines of the confirmation the order did not itself supply, so one journey
covering them is enough. The tolerance is deliberate: DemoBlaze renders the date
from the **browser's** clock, which need not share the runner's timezone — it
was observed a day behind — so pinning it to "today" would fail on timezone
rather than on the application.

| ID | Test title | Tags | Category / product | Checkout details |
|---|---|---|---|---|
| **TC-GCO-01** | buys a phone and sees the order confirmation | `@smoke @regression` | Phones / **Samsung galaxy s6** | Ronel Geronimo · Philippines · Manila · `4111111111111111` · `<month>` / `<year+2>` |
| **TC-GCO-02** | buys a laptop and sees the order confirmation | `@regression` | Laptops / **MacBook air** | Maria Santos · Netherlands · Amsterdam · `5555555555554444` · `<month+1>` / `<year+4>` |
| **TC-GCO-03** | buys a monitor and sees the order confirmation | `@regression` | Monitors / **ASUS Full HD** | Jan de Vries · Netherlands · Utrecht · `378282246310005` · `<month+2>` / `<year+3>` |

---

## TC-ACO — Authenticated checkout

**Spec:** [regression/auth-checkout.spec.ts](tests/regression/auth-checkout.spec.ts) ·
**Data:** [auth-checkout.json](src/data/test/auth-checkout.json) ·
**Describe:** `Authenticated checkout`

The signed-in counterpart of TC-GCO. It exercises checkout, not login — the login
form itself is `TC-LGP-01`.

**Preconditions:** signed in from the saved worker session; account cart emptied
by the fixture. **Skipped** when no credentials are configured.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Check the navbar | `Welcome <username>` is visible |
| 3 | Click the category link | The product's link appears in the catalogue |
| 4 | Click the product link | The product page opens and its title reads exactly the product name |
| 5 | Read the price shown on the product page | A numeric price is parsed — call it **P** |
| 6 | Click **Add to cart** | A browser alert reads `Product added.` (with the full stop) |
| 7 | Open `/cart.html` | A row for the product is visible; the cart total reads **P** |
| 8 | Click **Place Order** | The Place Order form opens |
| 9 | Fill Name, Country, City, Credit card, Month, Year | The fields accept the values |
| 10 | Click **Purchase** | A confirmation headed `Thank you for your purchase!` appears |
| 11 | Read the confirmation body | It contains `Amount: P USD`, `Name: <name>` and `Card Number: <card>` |
| 12 | Click **OK** | The confirmation dialog closes |
| 13 | Reload `/cart.html` | Still signed in (`Welcome <username>` visible) and the cart holds **0** rows |

| ID | Test title | Tags | Category / product | Checkout details |
|---|---|---|---|---|
| **TC-ACO-01** | buys a phone and sees the order confirmation | `@smoke @regression` | Phones / **Iphone 6 32gb** | Ronel Geronimo · Philippines · Quezon City · `4111111111111111` · `<month>` / `<year+2>` |
| **TC-ACO-02** | buys a laptop and sees the order confirmation | `@regression` | Laptops / **MacBook Pro** | Ronel Geronimo · Philippines · Quezon City · `5555555555554444` · `<month+6>` / `<year+5>` |

---

## TC-LGP — Valid login

**Spec:** [regression/login-positive.spec.ts](tests/regression/login-positive.spec.ts) ·
**Data:** inline · **Describe:** `Valid login`

### TC-LGP-01 — signs in through the login form and keeps the session across a reload

**Tags:** `@smoke @regression`

**Preconditions:** the saved session is deliberately discarded, so this case
starts **signed out**. The account itself is the worker's registered user.
**Skipped** when no credentials are configured.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Check the navbar | No welcome greeting; **Log in** is visible |
| 3 | Click **Log in** | The login dialog opens |
| 4 | Enter the account username and password, click **Log in** | The form submits |
| 5 | Wait for the navbar to settle | The login dialog closes; `Welcome <username>` becomes visible (allow up to 30 s — the site reloads before rendering the greeting); **Log in** is no longer shown |
| 6 | Reload `/index.html` | `Welcome <username>` is still visible — the session cookie persisted |

---

## TC-LGO — Log out

**Spec:** [regression/logout.spec.ts](tests/regression/logout.spec.ts) ·
**Data:** inline · **Describe:** `Log out`

### TC-LGO-01 — signs out and the session does not survive a reload

**Tags:** `@regression`

The other end of the session lifecycle from `TC-LGP-01`: that one proves a
session can be created and survives a reload, this proves it can be ended and
does *not*.

**Preconditions:** signed in from the saved worker session. **Skipped** when no
credentials are configured.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Check the navbar | `Welcome <username>` is visible |
| 3 | Click **Log out** | The page reloads |
| 4 | Check the navbar | **Log in** and **Sign up** are visible again; the welcome greeting is gone |
| 5 | Reload `/index.html` | Still signed out — no greeting, **Log in** still visible |

Step 5 is the point of the case. Logging out reloads the page, so the navbar at
step 4 could equally be the state that reload left behind; only asking the server
again proves the `tokenp_` cookie is really gone rather than merely not
rendered. It is the mirror of `TC-LGP-01` step 6.

---

## TC-LGN — Invalid login and sign-up

**Spec:** [regression/login-negative.spec.ts](tests/regression/login-negative.spec.ts) ·
**Data:** [login-negative.json](src/data/test/login-negative.json) ·
**Describe:** `Invalid login`

**Preconditions:** not signed in. No *shared* account is needed — every case
provisions whatever it requires, with names generated fresh per run, so none
depends on the state of an account a stranger on the public demo could change.

### TC-LGN-01 … TC-LGN-04 — rejected credentials

Four cases, same steps:

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Click **Log in** | The login dialog opens |
| 3 | Enter the username and password for the case, click **Log in** | A browser alert reads the expected message |
| 4 | Dismiss the alert and check the page | The dialog's **Log in** button is still visible (the attempt can be retried); no welcome greeting is shown |

| ID | Test title | Tags | Username | Password | Expected alert |
|---|---|---|---|---|---|
| **TC-LGN-01** | rejects a username that does not exist | `@smoke @regression` | generated, e.g. `nosuchuser_<timestamp>` | `Nu11-and-void!` | `User does not exist.` |
| **TC-LGN-02** | rejects an empty username and password | `@regression` | *(empty)* | *(empty)* | `Please fill out Username and Password.` |
| **TC-LGN-03** | rejects a username with no password | `@regression` | generated | *(empty)* | `Please fill out Username and Password.` |
| **TC-LGN-04** | rejects a password with no username | `@regression` | *(empty)* | `Nu11-and-void!` | `Please fill out Username and Password.` |

### TC-LGN-05 — rejects a sign-up for a username that is already taken

**Tags:** `@regression` · **Data:** inline (registers its own throwaway account)

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Click **Sign up** | The sign-up dialog opens |
| 3 | Register a freshly generated username, e.g. `ronelqa_<timestamp>` | A browser alert reads `Sign up successful.`; the sign-up dialog closes |
| 4 | Reload `/index.html` | The home page loads again — **required**: see defect DB-003, the sign-up dialog will not reopen after a successful registration until the page is reloaded |
| 5 | Click **Sign up** | The sign-up dialog opens |
| 6 | Register the *same* username again | A browser alert reads `This user already exist.` |

### TC-LGN-06 — rejects a valid username with the wrong password

**Tags:** `@regression` · **Data:** inline (registers its own throwaway account)

`TC-LGN-01` … `TC-LGN-04` can only reach "user does not exist" and the
empty-field validation, because a data row cannot bring an account with it. This
case needs one that really exists, so it registers its own.

| # | Action | Expected result |
|---|---|---|
| 1 | Register a freshly generated account, e.g. `ronelqa_<timestamp>` | The account exists and can be signed in to |
| 2 | Open `/index.html` | The home page loads |
| 3 | Click **Log in** | The login dialog opens |
| 4 | Enter that username with a deliberately wrong password, click **Log in** | A browser alert reads `Wrong password.` — a *different* message from `User does not exist.`, so the account was found and it was the password that was refused |
| 5 | Dismiss the alert and check the page | The dialog's **Log in** button is still visible; no welcome greeting is shown |

Step 1 registers over the API rather than through the sign-up modal on purpose:
this case is about the **login** form, and provisioning through the UI would make
it fail for a sign-up bug too — DB-003 among them.

### TC-LGN-07 — rejects a sign-up with no username and no password

**Tags:** `@regression` · **Data:** inline

The login form's own empty-field validation is `TC-LGN-02` … `TC-LGN-04`; this is
the sign-up modal's, which is a separate handler that happens to answer with the
same wording.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Click **Sign up** | The sign-up dialog opens |
| 3 | Leave both fields empty and click **Sign up** | A browser alert reads `Please fill out Username and Password.` |
| 4 | Dismiss the alert and check the page | The dialog's **Sign up** button is still visible; no welcome greeting is shown |

### TC-LGN-08 — accepts a sign-up for a username padded with spaces

**Tags:** `@regression` · **Data:** inline · **Defect:** **DB-009**

The one case in this group the application does **not** refuse. It asks the same
question the others do — what does sign-up do with input it should not take — and
the answer is that it takes it.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Click **Sign up** | The sign-up dialog opens |
| 3 | Register a generated username **wrapped in spaces**, e.g. `"  ronelqa_<timestamp>  "` | **Observed:** `Sign up successful.` — the padding is stored verbatim. **Should be:** the name is trimmed, or refused |
| 4 | Reload `/index.html` | Required — see defect DB-003 |
| 5 | Click **Log in** | The login dialog opens |
| 6 | Sign in with the **trimmed** name, `ronelqa_<timestamp>` | A browser alert reads `User does not exist.` — the account the user believes they registered was never created |

`"  bob  "` and `"bob"` are two different accounts, so a user who did not notice
the spaces they typed can never sign in again. The extreme case registers just as
cleanly: an account named with nothing but spaces exists on the public demo.

---

## TC-CKN — Checkout with invalid input

**Spec:** [regression/checkout-negative.spec.ts](tests/regression/checkout-negative.spec.ts) ·
**Data:** [checkout-negative.json](src/data/test/checkout-negative.json) ·
**Describe:** `Checkout with invalid input`

All five use one product — Phones / **Sony xperia z5**. The product is not what
is under test; the form is.

**Preconditions:** not signed in; empty cart.

### TC-CKN-01 … TC-CKN-03 — orders the application refuses

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Click **Phones**, then **Sony xperia z5** | The product page opens |
| 3 | Click **Add to cart** | A browser alert reads `Product added` |
| 4 | Open `/cart.html` | The product's row is visible |
| 5 | Click **Place Order** | The Place Order form opens |
| 6 | Fill only the fields listed for the case, leaving the rest untouched | The named fields accept the values |
| 7 | Click **Purchase** | A browser alert reads `Please fill out Name and Creditcard.` |
| 8 | Dismiss the alert, click **Close**, look at the cart | The **Purchase** button is still available before closing; after closing, the product's row is still in the cart — a refused order destroys neither the basket nor the entered data |

| ID | Test title | Tags | Fields filled |
|---|---|---|---|
| **TC-CKN-01** | refuses an order when the checkout form is empty | `@smoke @regression` | none |
| **TC-CKN-02** | refuses an order with a name but no credit card | `@regression` | Ronel Geronimo · Philippines · Manila |
| **TC-CKN-03** | refuses an order with a credit card but no name | `@regression` | `4111111111111111` · `<month>` / `<year+2>` |

### TC-CKN-04 … TC-CKN-05 — orders the application should refuse but does not

> These two record **current, defective behaviour**. They pass today because the
> application wrongly accepts the order. When the defect is fixed they will fail —
> that failure is the signal to rewrite them as refusal cases. See
> [Known-defect cases](#known-defect-cases).

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | *(TC-CKN-04 only)* Click **Phones**, **Sony xperia z5**, then **Add to cart** | A browser alert reads `Product added` |
| 3 | Open `/cart.html` | The cart holds **1** row for TC-CKN-04, **0** rows for TC-CKN-05 |
| 4 | Click **Place Order** | The Place Order form opens |
| 5 | Fill the fields listed for the case | The fields accept the values |
| 6 | Click **Purchase** | **Observed:** a confirmation headed `Thank you for your purchase!` appears. **Should be:** the order is refused |
| 7 | Read the confirmation body | It contains `Name: <name>` and `Card Number: <card>` — the invalid input was accepted verbatim |

| ID | Test title | Tags | Cart | Fields filled | Defect |
|---|---|---|---|---|---|
| **TC-CKN-04** | accepts a malformed credit card, expiry month and expiry year | `@regression` | 1 item | Ronel Geronimo · Philippines · Manila · card `not-a-card-!!` · month `13` · year `<year-5>` | **DB-001** |
| **TC-CKN-05** | accepts an order placed with an empty cart | `@regression` | empty | Ronel Geronimo · Philippines · Manila · `4111111111111111` · `<month>` / `<year+2>` | **DB-002** |
| **TC-CKN-07** | accepts an order with no address and no expiry date | `@regression` | 1 item | Ronel Geronimo · `4111111111111111` — **country, city, month and year all left blank** | **DB-008** |

### TC-CKN-06 — accepts a whitespace-only name and credit card

**Tags:** `@regression` · **Data:** inline · **Defect:** **DB-006**

Hand-written rather than a data row: the group above asserts the confirmation
echoes back the name and card it was given, and the whole point of this case is
that it does not.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html`, click **Phones**, then **Sony xperia z5** | The product page opens |
| 2 | Click **Add to cart** | A browser alert reads `Product added` |
| 3 | Open `/cart.html` | The cart holds **1** row |
| 4 | Click **Place Order** | The Place Order form opens |
| 5 | Enter a single space as the Name and a single space as the Credit card; fill Country, City, Month and Year normally | The fields accept the spaces |
| 6 | Click **Purchase** | **Observed:** a confirmation headed `Thank you for your purchase!` appears. **Should be:** the order is refused |
| 7 | Read the confirmation body | `Name:` and `Card Number:` come back **completely empty** — an order nobody can be billed for or shipped to |

DemoBlaze checks the two fields are non-empty *strings*, which `"   "` satisfies.

`TC-CKN-07` is a data row and so runs through the group-B steps above; only its
data differs, which is why it appears in that table rather than here. It proves
the other four fields are never validated at all: an order with nowhere to ship
it and no expiry to authorise the card against is taken without complaint.

---

## TC-OMF — Place Order form state

**Spec:** [regression/order-modal.spec.ts](tests/regression/order-modal.spec.ts) ·
**Data:** inline · **Describe:** `Place Order form` · **Tags:** `@regression`

Every other case drives this form *forwards* — fill it, submit it, read the
outcome. These four read the form **back**, so a form that opened pre-filled,
lost the address when an order was refused, or kept a card number after being
dismissed would no longer pass unnoticed.

`TC-OMF-01` and `TC-OMF-04` are a deliberate pair: a form should open **empty**
on a freshly loaded page and **keep** what was typed while that page stands.
Either fact alone is satisfied by a form that is simply always empty, or always
stale.

**Preconditions:** not signed in; empty cart. All four use one product —
Phones / **Nokia lumia 1520** — and, where they fill it, the same details:
Ronel Geronimo · Philippines · Manila · `4111111111111111` · `09` / `2030`.

### TC-OMF-01 — opens with every field empty and shows what the cart totals

| # | Action | Expected result |
|---|---|---|
| 1 | Add **Nokia lumia 1520** to the cart, noting the price **P** | The alert reads `Product added` |
| 2 | Open `/cart.html` | The cart holds **1** row |
| 3 | Click **Place Order** | The form opens |
| 4 | Read all six fields | **Every one is empty** — Name, Country, City, Credit card, Month and Year |
| 5 | Read the total on the form | It shows **P**, before any card details have been entered |

### TC-OMF-02 — keeps every detail entered when an order is refused

| # | Action | Expected result |
|---|---|---|
| 1 | Add the product and open the Place Order form | The form opens |
| 2 | Fill Country, City, Month and Year, but leave Name and Credit card empty | The four fields accept the values |
| 3 | Click **Purchase** | A browser alert reads `Please fill out Name and Creditcard.` |
| 4 | Dismiss the alert and read all six fields | Country, City, Month and Year **still hold what was entered**; Name and Credit card are still empty |

Being sent back to an emptied form is how a checkout loses a customer, so the
refusal must cost the shopper nothing they already typed.

### TC-OMF-03 — closes without placing an order when the form is dismissed

| # | Action | Expected result |
|---|---|---|
| 1 | Add the product and open the Place Order form | The form opens |
| 2 | Fill all six fields | The fields accept the values |
| 3 | Click **Close** | The form is hidden |
| 4 | Look at the page | **No** order confirmation appeared, and the cart still holds its **1** row |

Dismissing a filled form must not be a way to place an order by accident, nor to
lose the basket.

### TC-OMF-04 — keeps the entered details after the form is dismissed and reopened

**Defect:** **DB-007**

| # | Action | Expected result |
|---|---|---|
| 1 | Add the product and open the Place Order form | The form opens |
| 2 | Fill all six fields | The fields accept the values |
| 3 | Click **Close** | The form is hidden |
| 4 | Click **Place Order** again | The form reopens |
| 5 | Read all six fields | **Observed:** all six still hold the previous attempt, the full credit card number included. **Should be:** the form is cleared when dismissed |

---

## TC-A11Y — Accessibility

**Spec:** [regression/accessibility.spec.ts](tests/regression/accessibility.spec.ts) ·
**Data:** [accessibility.json](src/data/test/accessibility.json) ·
**Describe:** `Accessibility` · **Tags:** `@a11y @regression`

Scanned with axe against **WCAG 2.0 A and AA**. DemoBlaze has real, long-standing
violations, so the assertion is not "zero violations" — each page carries a
baseline of the rule ids it breaks today and the found set must **equal** it:

- a **new** rule id → fail, something regressed;
- a **missing** rule id → fail, something was fixed and the baseline must shrink.

**Preconditions:** Chromium only. The other browsers skip — axe's colour-contrast
result is computed from rendered styles and the three engines genuinely disagree,
so contrast is checked once against a single reference engine.

| # | Action | Expected result |
|---|---|---|
| 1 | Open the page under test | The page's "ready" text is visible |
| 2 | Run axe with tags `wcag2a`, `wcag2aa` | The scan completes and returns its violations |
| 3 | Compare the violated rule ids with the page's baseline | The two sets are equal. The full human-readable violation report is attached to the test result either way |

| ID | Test title | Page | Ready text | Baseline rule ids |
|---|---|---|---|---|
| **TC-A11Y-01** | the homepage breaks no accessibility rules beyond its baseline | `/index.html` | `CATEGORIES` | `image-alt` |
| **TC-A11Y-02** | a product page breaks no accessibility rules beyond its baseline | `/prod.html?idp_=1` | `Samsung galaxy s6` | `color-contrast`, `image-alt`, `link-name` |
| **TC-A11Y-03** | the cart breaks no accessibility rules beyond its baseline | `/cart.html` | `Products` | `color-contrast`, `image-alt` |

Each baseline entry carries the reason it is tolerated in
[accessibility.json](src/data/test/accessibility.json).

---

## TC-EGS / TC-EUS — Cart journeys

Three journeys that exercise the **cart** rather than the checkout form, each run
twice — once as a guest, once signed in. That is not the same test twice:
DemoBlaze stores a guest cart against an anonymous cookie and a member cart
against the account, through two different code paths. DB-004 is the visible edge
of the split, and each file pins its own alert spelling.

| Journey | Guest | Signed in |
|---|---|---|
| Buy a phone, filling every field of the checkout form | `TC-EGS-01` | `TC-EUS-01` |
| Add three items, remove two, buy the one left | `TC-EGS-02` | `TC-EUS-02` |
| Add six items, remove all six, order anyway | `TC-EGS-03` | `TC-EUS-03` |

**Specs:** [e2e/guest-scenarios.spec.ts](tests/e2e/guest-scenarios.spec.ts) ·
[e2e/user-scenarios.spec.ts](tests/e2e/user-scenarios.spec.ts) ·
**Data:** [cart-management.json](src/data/test/cart-management.json) — both files
use the same three baskets. **All six are tagged `@e2e @regression`.**

The signed-in cases are **skipped** when no credentials are configured.

**Adding a product** always means the full shopper's route — home page → category
→ product → read the price → **Add to cart** — repeated per item, so a six-item
basket is six passes through the catalogue.

### Journey 1 — buy a phone through the full checkout form

**TC-EGS-01** — `buys a phone as a guest and pays through the full checkout form`
**TC-EUS-01** — `buys a phone when signed in and pays through the full checkout form`

**Data:** Phones / **Nokia lumia 1520**; Ronel Geronimo · Philippines · Manila ·
`4111111111111111` · `<month>` / `<year+2>`.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Check the navbar | **Guest:** **Log in** visible, no greeting. **Signed in:** `Welcome <username>` visible |
| 3 | Add **Nokia lumia 1520** to the cart, noting the price **P** | The alert reads `Product added` as a guest, `Product added.` signed in |
| 4 | Open `/cart.html` | The product's row is visible; the cart holds exactly **1** row; the total reads **P** |
| 5 | Click **Place Order** | The form opens and already shows **P** as the amount — *before* any card details are entered |
| 6 | Fill Name, Country, City, Credit card, Month, Year | Every one of the six fields holds exactly what was typed |
| 7 | Click **Purchase** | A confirmation headed `Thank you for your purchase!` appears |
| 8 | Read the confirmation body | It contains `Amount: P USD`, `Name: Ronel Geronimo`, `Card Number: 4111111111111111` |
| 9 | Click **OK** | The confirmation dialog closes |
| 10 | Reload `/cart.html` | The cart holds **0** rows *(signed in: and `Welcome <username>` is still visible)* |

### Journey 2 — remove two of three, buy the one left

**TC-EGS-02** — `removes the phone and one laptop from a three-item guest cart, then buys the laptop left`
**TC-EUS-02** — `removes the phone and one laptop from a three-item cart, then buys the laptop left`

**Data:** add **Iphone 6 32gb** (Phones), **MacBook air** (Laptops), **Dell i7
8gb** (Laptops); remove **Iphone 6 32gb** and **MacBook air**; Maria Santos ·
Netherlands · Amsterdam · `5555555555554444` · `<month+1>` / `<year+4>`.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Check the navbar | As journey 1, step 2 |
| 3 | Add the three products in order, noting each price | Each raises the alert matching the session state — checked per product, so a mismatch names the product |
| 4 | Open `/cart.html` | The cart holds **3** rows; their titles are exactly the three added, and the total is the sum of the three prices |
| 5 | Delete the **Iphone 6 32gb** row, then the **MacBook air** row | After each delete the cart comes back exactly one row shorter |
| 6 | Look at the cart | The cart holds **1** row, **Dell i7 8gb**, and the total is that laptop's price — recalculated by the server, so it proves the deletes landed rather than just leaving the table |
| 7 | Click **Place Order** | The form opens showing the surviving laptop's price as the amount |
| 8 | Fill Name, Country, City, Credit card, Month, Year | The fields accept the values |
| 9 | Click **Purchase** | A confirmation headed `Thank you for your purchase!` appears |
| 10 | Read the confirmation body | The amount is the **surviving laptop's price**, not the basket as first built; `Name: Maria Santos`; `Card Number: 5555555555554444` |
| 11 | Click **OK** | The confirmation dialog closes |
| 12 | Reload `/cart.html` | The cart holds **0** rows *(signed in: and still signed in)* |

### Journey 3 — empty a six-item cart, then order anyway

**TC-EGS-03** — `accepts a guest order after every item has been removed from a six-item cart`
**TC-EUS-03** — `accepts an order after every item has been removed from a six-item cart`

> Records **current, defective behaviour** — see
> [Known-defect cases](#known-defect-cases). This reaches DB-002 by a different
> route than TC-CKN-05: the basket is verified to hold six items, then verified
> to hold none, and the order is *still* taken. Running it signed in as well
> shows the order is accepted even when posted with a session token against an
> account cart.

**Data:** add **Samsung galaxy s7** (Phones), **Sony vaio i5** and **2017 Dell
15.6 Inch** (Laptops), **Apple monitor 24** and **ASUS Full HD** ×2 (Monitors);
Jan de Vries · Netherlands · Utrecht · `378282246310005` · `<month+2>` /
`<year+3>`.

`ASUS Full HD` appears twice on purpose — the journey calls for three monitors
and DemoBlaze sells two. That duplicate is what makes the basket six items, and
it is why the cart is emptied by row **position** rather than by title.

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/index.html` | The home page loads |
| 2 | Check the navbar | As journey 1, step 2 |
| 3 | Add all six products in order, noting each price | Each raises the alert matching the session state |
| 4 | Open `/cart.html` | The cart holds **6** rows; the titles match the six added — including `ASUS Full HD` twice — and the total is the sum of the six prices |
| 5 | Delete the last row, repeatedly, until none is left | After each delete the cart comes back exactly one row shorter (6 → 5 → … → 0) |
| 6 | Reload `/cart.html` | The cart holds **0** rows. *The reload matters: an empty table and a page mid-reload look alike* |
| 7 | Click **Place Order** | **Observed:** the form opens on an empty cart. **Should be:** unavailable, or the order refused |
| 8 | Fill Name, Country, City, Credit card, Month, Year | The fields accept the values |
| 9 | Click **Purchase** | **Observed:** a confirmation headed `Thank you for your purchase!` appears. **Should be:** the order is refused |
| 10 | Read the confirmation body | It contains `Name: Jan de Vries` and `Card Number: 378282246310005` |
| 11 | Click **OK** | The confirmation dialog closes |
| 12 | Reload `/cart.html` | The cart still holds **0** rows *(signed in: and still signed in)* |

---

## Known-defect cases

Four cases assert what the application **actually does**, not what it should do,
so the suite reports a product bug without going red for a defect it did not
cause. Each attaches a `DEFECT DB-00x` note to its test result stating what
should have happened.

| Case | Defect | Should have been |
|---|---|---|
| `TC-CKN-04` | **DB-001** | The order should be refused — the card is not numeric, month 13 does not exist, and the expiry year is five years in the past |
| `TC-CKN-05` | **DB-002** | Place Order should be unavailable, or the order refused, when the cart holds no items |
| `TC-CKN-06` | **DB-006** | The order should be refused — a name and card of nothing but spaces are not a name and a card. The confirmation comes back with neither |
| `TC-CKN-07` | **DB-008** | The order should be refused, or the expiry date at least required — country, city, month and year were all blank and the order was still taken |
| `TC-LGN-08` | **DB-009** | Sign-up should trim the username, or refuse one that is blank once trimmed — `"  bob  "` and `"bob"` should not be two accounts |
| `TC-EGS-03` | **DB-002** | As above, reached by emptying a six-item cart rather than never filling one |
| `TC-EUS-03` | **DB-002** | As above, with an account cart and a session token |
| `TC-OMF-04` | **DB-007** | Dismissing the Place Order form should clear it, so a credit card number does not outlive the order it was typed for |

**When one of these starts failing, the defect has been fixed.** The case must
then be rewritten to expect the correct behaviour — for `TC-CKN-04` and
`TC-CKN-05`, by moving the row in
[checkout-negative.json](src/data/test/checkout-negative.json) from
`purchaseAccepted` to `alert`; for `TC-OMF-04`, by expecting an empty form.

Two further defects shape the cases above without having a case of their own:
**DB-003** forces the page reload in `TC-LGN-05` step 4, and **DB-004** is why
guest and signed-in cases expect different add-to-cart alert text. Full details,
severity and reproduction steps are in the
[defect log](README.md#defect-log).

---

## Conditional execution

| Condition | Effect |
|---|---|
| No `DEMOBLAZE_USER` / `DEMOBLAZE_PASS` configured | `TC-ACO-*`, `TC-LGP-01`, `TC-LGO-01` and `TC-EUS-*` skip with a message naming the missing setup. The other **28 of 35** still run |
| Browser is Firefox or WebKit | `TC-A11Y-*` skip — Chromium only, on purpose |

Everything else runs on all three browser projects. See
[README.md](README.md#running) for how to select environments and browsers.
