# Test Automation Coding Conventions & Best Practices
### Playwright + TypeScript — Ecommerce Website

**Version:** 1.0
**Last updated:** 2026-09-08
**Applies to:** End-to-end (E2E), API, and visual regression test suites for the storefront and checkout experience

---

## 1. Purpose & Scope

This document defines the coding conventions, architecture, and best practices for building and maintaining the Playwright test automation suite for our ecommerce website. It is intended for QA engineers, SDETs, and developers who write or review automated tests.

Goals:

- Consistent, readable, and maintainable test code across the team.
- Fast, reliable (non-flaky) test execution in CI.
- Clear ownership boundaries between UI, API, and visual tests.
- Safe handling of sensitive data (payment details, PII) in test environments.

Out of scope: unit testing conventions (covered separately), performance/load testing, and manual QA processes.

---

## 2. Tech Stack & Tooling

| Tool | Purpose |
|---|---|
| Playwright Test (`@playwright/test`) | Test runner, assertions, fixtures, tracing |
| TypeScript | Static typing across the suite |
| ESLint + `@typescript-eslint` | Linting, including `no-floating-promises` to catch missing `await` |
| Prettier | Code formatting |
| dotenv | Environment variable management per test environment |
| GitHub Actions (or equivalent CI) | Pipeline execution, sharding, reporting |
| Allure / Playwright HTML Reporter | Test reporting |
| Faker.js | Synthetic test data generation |

Keep Playwright and browser binaries current (`npx playwright install --with-deps`) so tests run against up-to-date browser engines. Pin the `@playwright/test` version in `package.json` and bump it deliberately, not automatically, so a version bump can be reviewed and tested rather than silently changing CI behavior.

---

## 3. Project Structure

This repo (`IONA-test-automation-quiz`) uses a **per-candidate submission layout**, not a domain-driven one. Each candidate works inside their own folder under `playwright/`, named in camelCase after their first and last name — there is no shared, repo-wide `pages/`, `components/`, or `data/` structure to plug into.

```
IONA-test-automation-quiz/
├── README.md
├── package.json
├── tsconfig.json                    # TypeScript config (Cypress track)
├── playwright.config.ts             # Playwright configuration (testDir: ./playwright)
├── playwright/
│   ├── tsconfig.json                # TypeScript config for Playwright
│   └── johnDoe/                     # your own folder — camelCase first + last name
│       └── checkout.spec.ts
├── cypress/                          # alternate framework track (not covered by this doc)
└── .github/
    └── workflows/
        └── playwright-tests.yml
```

Rules:

- Don't create repo-root `pages/`, `components/`, or `data/` folders — they don't exist in this template, and there's no expectation of shared fixtures or page objects across candidates.
- Everything you write lives inside your own `playwright/<yourName>/` folder. Don't add files outside it or edit another candidate's folder.
- You're free to apply the Page Object Model or fixture patterns from §6 within your own submission if you want to demonstrate that skill — just nest them inside your folder (e.g. `playwright/johnDoe/pages/checkout.page.ts`, `playwright/johnDoe/fixtures/auth.fixture.ts`) so the submission stays self-contained. It's optional, not required, for the three acceptance-criteria scenarios.
- Spec file naming inside your folder still follows §4 (`checkout.spec.ts`, kebab-case for multi-word features).

---

## 4. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Spec files | `<feature>.spec.ts`, kebab-case | `guest-checkout.spec.ts` |
| Page object files | `<page>.page.ts` | `checkout.page.ts` |
| Page object classes | PascalCase + `Page` suffix | `class CheckoutPage` |
| Component classes | PascalCase + `Component` suffix | `class MiniCartComponent` |
| Fixture files | `<name>.fixture.ts` | `auth.fixture.ts` |
| Test titles | Plain-English, behavior-first, start with a verb | `"adds an item to the cart from the PDP"` |
| `describe` blocks | Feature or user journey name | `test.describe('Guest checkout')` |
| Data-testid attributes | kebab-case, stable, not tied to visual copy | `data-testid="checkout-submit-button"` |
| Environment variables | `SCREAMING_SNAKE_CASE`, prefixed by concern | `PAYMENT_GATEWAY_SANDBOX_KEY` |

Test titles should read as a sentence when combined with their `describe` block, e.g. `Guest checkout > adds a promo code at the payment step`. Avoid vague titles like `"test 1"` or `"checkout works"`.

---

## 5. Locator Strategy

Favor **user-facing, role-based locators** over CSS/XPath selectors tied to DOM structure — they are what Playwright's own best-practice guidance recommends, and they break far less often when markup changes.

Priority order:

1. `getByRole()` — accessible role + accessible name (`getByRole('button', { name: 'Add to Cart' })`)
2. `getByLabel()` / `getByPlaceholder()` — form fields
3. `getByTestId()` — for elements with no meaningful role/text, or where visible copy changes frequently (promotional banners, localized strings)
4. `getByText()` — sparingly, for user-visible copy that is stable
5. CSS/XPath — last resort only, and must include a comment explaining why a more resilient locator wasn't possible

```ts
// Good
await page.getByRole('button', { name: 'Add to Cart' }).click();
await checkoutPage.getByLabel('Card number').fill(card.number);

// Avoid
await page.locator('.btn.btn-primary.pdp-add-cart-btn').click();
```

Use `.filter({ hasText: ... })` and `.locator(...).nth()`/`.first()` to disambiguate rather than adding brittle index-based selectors throughout the codebase. Never hardcode `nth-child`-style CSS indices for dynamic lists (e.g. product grids, cart line items) — filter by content instead.

Never `await page.waitForTimeout(...)` to "wait for the UI to catch up." Playwright's locators and web-first assertions auto-wait; a fixed sleep is almost always masking a real synchronization issue and adds flakiness and slowness instead of fixing it.

---

## 6. Page Object Model & Fixtures

**Page objects expose actions and locators. Tests own the assertions.** This keeps assertions visible in the test (where a reader expects to find "what is this test checking") and keeps page objects reusable across many different assertions.

```ts
// pages/checkout.page.ts
import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email address');
    this.submitButton = page.getByRole('button', { name: 'Continue to payment' });
  }

  async fillGuestEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async continueToPayment() {
    await this.submitButton.click();
  }
}
```

```ts
// tests/checkout/guest-checkout.spec.ts
test('guest can proceed to payment with a valid email', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await checkout.fillGuestEmail('shopper@example.com');
  await checkout.continueToPayment();

  await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
});
```

**Use fixtures for setup, not `beforeEach` chains scattered across files.** Extend the base `test` object so common preconditions (authenticated session, seeded cart, API context) are declared once and reused.

```ts
// fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { AccountPage } from '../pages/account.page';

type AuthFixtures = {
  loggedInPage: Page;
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await new AccountPage(page).loginAs('standard-user');
    await use(page);
  },
});
```

Prefer **API-driven or storage-state setup** over UI-driven setup for preconditions that aren't the thing under test (e.g. logging in before testing checkout). Use Playwright's `storageState` and a one-time authenticated setup project so individual tests don't each pay the cost of a full UI login.

---

## 7. Test Data Management

- Never hardcode production-like personal data (real names, real emails, real card numbers) in test code. Use Faker.js-based data factories to generate synthetic data per test run.
- Each test creates and owns its own data (its own user, cart, address) rather than depending on data seeded by another test or a shared fixture record — this is what makes tests safe to run in parallel and in any order.
- Use dedicated **sandbox/test accounts** for the payment gateway (e.g. Stripe test mode, PayPal sandbox) — never real payment credentials, even in staging.
- Centralize test data builders under `data/factories/` so a change to the checkout form (e.g. a new required field) is a one-line fix, not a find-and-replace across dozens of specs.

```ts
// data/factories/address.factory.ts
import { faker } from '@faker-js/faker';

export function buildShippingAddress(overrides: Partial<Address> = {}): Address {
  return {
    fullName: faker.person.fullName(),
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    postalCode: faker.location.zipCode(),
    country: 'US',
    ...overrides,
  };
}
```

---

## 8. Ecommerce-Specific Testing Guidelines

### 8.1 Browsing, search & PLP/PDP

- Cover filtering, sorting, pagination, and out-of-stock states as distinct scenarios rather than one large "browse the catalog" test.
- Mock or seed catalog data for deterministic assertions (exact result counts, specific SKUs) instead of asserting against live, ever-changing production inventory.
- Test empty-state and zero-results search separately from the happy path.

### 8.2 Cart

- Cover: add single item, add multiple items, update quantity, remove item, cart persistence across navigation/reload, and cart merge on login (guest cart → logged-in cart).
- Assert both UI state (mini-cart badge count, line-item totals) and, where feasible, the underlying cart total calculation (subtotal, tax, shipping, discounts) to catch pricing logic regressions.

### 8.3 Checkout & payment flows

Checkout and payment are the highest-value, highest-risk part of the suite — prioritize stability here over coverage breadth.

- **Isolate payment from the rest of checkout.** Test address entry, shipping method selection, and payment submission as separable steps with their own assertions, so a failure pinpoints exactly which step broke.
- **Always use payment gateway sandbox/test mode.** Never exercise real charge flows in automated tests, including in staging.
- **Cover both success and failure paths explicitly**: declined card, expired card, invalid CVV, insufficient funds (using the test card numbers your gateway provides for each scenario), and network/timeout handling on the payment step.
- **Mock third-party payment iframes carefully.** Many gateways (Stripe Elements, Braintree, Adyen) render fields inside cross-origin iframes; use Playwright's `frameLocator()` rather than trying to pierce the iframe with a plain locator.
- **Never log or snapshot full card numbers, CVVs, or tokens** — see §16.
- Test promo codes / discount application, and gift card redemption, as their own scenarios rather than folding them into a single "full checkout" mega-test.
- Verify order confirmation content (order number format, line items, totals) and, where applicable, that a confirmation email/API event fires — this can be asserted via a mocked email service or an API assertion rather than reading a real inbox.

### 8.4 Account & authentication

- Cover registration, login, logout, password reset, and session expiry.
- Treat auth as a fixture (see §6), not something re-tested at the top of every unrelated spec.

### 8.5 Order history & post-purchase

- Cover viewing past orders, order status, and reorder/return flows if present in the product.

---

## 9. API Testing

Not everything needs a browser. Use Playwright's built-in `APIRequestContext` for testing backend endpoints directly (inventory checks, pricing calculations, cart APIs) — it's faster and less flaky than driving the same check through the UI.

```ts
// tests/api/cart-api.spec.ts
import { test, expect } from '@playwright/test';

test('POST /api/cart returns updated totals when an item is added', async ({ request }) => {
  const response = await request.post('/api/cart/items', {
    data: { sku: 'SKU-1234', quantity: 2 },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.itemCount).toBe(2);
});
```

Guidelines:

- Use API calls to **set up UI test state** (seed a cart, create an order) instead of clicking through the UI to reach a precondition — this is one of the biggest speed and reliability wins available.
- Keep API assertions focused on contract and business logic (status codes, response shape, calculated values), not on things already covered by UI tests.
- Reuse the same data factories from §7 so API and UI tests build consistent test data.

---

## 10. Visual Regression Testing

- Use Playwright's `toHaveScreenshot()` for key, high-traffic surfaces: homepage, PLP grid, PDP, cart drawer, and checkout steps. Don't snapshot every page — visual tests are the most maintenance-heavy and should be applied selectively.
- Run visual tests against a **stable, seeded dataset** on a fixed viewport/browser (typically Chromium) so snapshots aren't flaky due to live inventory, rotating promotional banners, or timestamps.
- Mask or exclude genuinely dynamic regions (countdown timers, "X people viewing this" widgets, ads) with the `mask` option rather than letting them cause false failures.
- Store baseline screenshots in version control and review diffs as part of the PR process; update baselines deliberately, never by blanket-approving CI failures.
- Run visual tests as a separate CI job/tag from functional E2E tests so a visual diff doesn't block a functional-only pipeline (and vice versa).

---

## 11. Assertions & Waiting

- Use **web-first assertions** (`await expect(locator).toBeVisible()`, `.toHaveText()`, `.toHaveCount()`, etc.) — they auto-retry until the condition is met or the timeout elapses, which is what makes Playwright tests stable without manual waits.
- Never assert on a non-retrying snapshot of state, e.g. `expect(await locator.isVisible()).toBe(true)`. This checks the DOM once and does not wait.
- Use `expect.soft()` when you want a test to report multiple independent failures in one run (e.g. checking several fields on an order confirmation page) rather than stopping at the first failure.
- Prefer specific assertions (`toHaveText('Out of stock')`) over generic ones (`toBeTruthy()`) so failures are self-explanatory in CI logs without needing to reproduce locally.

---

## 12. Test Independence & Isolation

- Every test must be runnable **alone, in any order, and in parallel** with every other test. No test should depend on state left behind by another test.
- Each test gets its own browser context (Playwright does this by default per test) — never share a `page` object across tests via a module-level variable.
- Clean up data a test creates when practical (e.g. via API teardown), but design tests to be resilient even if cleanup is skipped (e.g. by using uniquely generated data per run rather than fixed IDs that could collide).
- Don't test third-party sites or services you don't control (payment gateway's own hosted pages beyond the integration point, shipping carrier tracking pages, etc.) — mock those boundaries instead.

---

## 13. Environment & Configuration Management

- Keep environment-specific config (base URLs, API keys, feature flags) in `.env.<environment>` files loaded via `playwright.config.ts`, never hardcoded in specs.
- Define separate Playwright **projects** per environment/browser combination in `playwright.config.ts` rather than duplicating config logic in code.
- Secrets (payment sandbox keys, test account credentials) are injected via CI secret storage, never committed to the repo — see §16.

```ts
// playwright.config.ts (excerpt)
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html'], ['github']],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
```

---

## 14. CI/CD Integration & Parallelization

- Run the full suite on every pull request; run a fast **smoke subset** (tagged `@smoke`) on every push for quick feedback, reserving the full regression suite for PR merge/nightly runs.
- Use Playwright's built-in parallelism (`fullyParallel: true`) plus CI-level **sharding** (`--shard=1/4`, etc.) to split the suite across multiple CI machines/jobs for large suites.
- Set `retries` in CI (e.g. `2`) to absorb genuine environmental flakiness, but treat a test that only passes on retry as a bug to investigate, not a permanent state — track and triage flaky tests rather than normalizing them.
- Install only the browsers you need in CI (`npx playwright install chromium --with-deps`) to keep pipeline runtime down, adding Firefox/WebKit projects only where cross-browser coverage is actually required.
- Enable tracing on first retry (`trace: 'on-first-retry'`) rather than always-on, to balance CI artifact size against debuggability.
- Publish the HTML report (and traces) as a CI artifact so a failure can be triaged from the trace viewer without reproducing locally.
- Gate merges on the smoke suite at minimum; a full-suite failure should block release but shouldn't necessarily block every commit if the suite is large and slow.

---

## 15. Reporting & Debugging

- Use the Playwright Trace Viewer (not raw screenshots) as the primary debugging tool for CI failures — it captures the full action timeline, DOM snapshots, network requests, and console logs.
- Name tests and steps descriptively enough that a report reader can understand what failed without opening the trace (`test.step('fills payment details', async () => { ... })` groups related actions for clearer reports).
- Fail fast on setup/precondition errors with a clear message rather than letting a downstream assertion fail with a confusing error.

---

## 16. Security & Sensitive Data Handling

- Use only payment gateway **sandbox/test-mode** credentials and test card numbers. Real payment credentials must never appear in test code, fixtures, CI logs, or screenshots.
- Never log full card numbers, CVVs, or auth tokens, even in debug output. Mask them in any custom logging utilities.
- When capturing screenshots/videos/traces on failure, verify masking is applied to payment iframes and sensitive fields (`mask` option, or exclude those steps from trace capture) so CI artifacts don't leak PII or card data.
- Store API keys and test account credentials in CI secret management, not in `.env` files committed to the repo. Provide an `.env.example` with placeholder values instead.
- Synthetic PII only (see §7) — no real customer data in any test environment.

---

## 17. Git & Version Control Conventions

- Branch naming: `<your-name>/<date-of-submission>` in **DD-MM-YYYY** format (e.g. `john-doe/25-08-2026`), per the README's contribution guide — not domain-based branch names.
- One logical change per PR; avoid bundling unrelated spec additions with framework/config changes.
- PRs that add or modify tests must run green in CI before merge — no merging with a known-failing or skipped test without an explicitly justified, ticketed `test.fixme()`/`test.skip()`.
- Code review checklist for test PRs:
  - [ ] Uses role/label/testid locators, not brittle CSS/XPath
  - [ ] No `waitForTimeout()` / fixed sleeps
  - [ ] Assertions live in the test, not the page object
  - [ ] Test is independent (no reliance on execution order or another test's leftover state)
  - [ ] No hardcoded production data or real payment credentials
  - [ ] New page objects/components follow the naming conventions in §4
  - [ ] Visual tests mask genuinely dynamic content
  - [ ] Test title clearly describes the behavior under test

---

## 18. Appendix

### 18.1 Recommended `.eslintrc` additions

```json
{
  "plugins": ["@typescript-eslint", "playwright"],
  "extends": ["plugin:playwright/recommended"],
  "rules": {
    "@typescript-eslint/no-floating-promises": "error"
  }
}
```

### 18.2 Suggested test tags

Use Playwright's tag syntax in test titles to slice suites for CI (smoke vs. full regression, per-domain runs):

```ts
test('adds an item to the cart from the PDP @smoke @cart', async ({ page }) => {
  // ...
});
```

Run a subset with `npx playwright test --grep @smoke`.

---

*This is a living document. Propose changes via PR against this file; significant changes to conventions should be discussed with the QA/SDET team before adoption.*
