# Playwright Assessment Notes

This folder contains the Playwright solution for the DemoBlaze checkout assessment.

The suite is organized around simple Page Object Models (POMs), stable selectors, and explicit assertions mapped to each acceptance criterion.

Current data strategy:

- Alert and validation expectations are static (contract checks).
- Checkout form input data is generated dynamically with Faker.
- Category and product selection are fully random at runtime from available options.
- A run-level random seed is applied so random choices can be replayed.

## Scope

- Full guest checkout flow
- Full authenticated checkout flow
- Negative coverage for invalid inputs and bad states
- Regression checks for core catalog and cart behavior

## Folder Structure

- `checkout.spec.ts`: Main test suite
- `data/testData.ts`: Test data and expected alert messages
- `pages/homePage.ts`: Home and category navigation interactions
- `pages/authModal.ts`: Login and sign-up modal interactions
- `pages/productPage.ts`: Product detail and add-to-cart interactions
- `pages/cartPage.ts`: Cart validations and place-order action
- `pages/orderModal.ts`: Checkout form and purchase assertions
- `utils/demoblazeApi.ts`: API helper for test user provisioning
- `utils/randomSeed.ts`: Seed resolver for reproducible random runs

## Tags

The suite uses Playwright tags for filtering:

- `@AC1`
- `@AC2`
- `@AC3`
- `@regression`

## Randomization Strategy

The suite intentionally uses full-random category selection and random product selection from the currently available catalog list.

Why this was chosen:

- Product IDs, names, and prices can change on DemoBlaze, so hard-coded product fixtures are brittle.
- The acceptance criteria allow selecting a product from any category.
- Randomized selection validates behavior against live catalog state instead of static assumptions.

What this improves:

- Less test maintenance when catalog content changes.
- Better confidence that flows work across categories and products, not only one fixed item.

Risks and tradeoffs:

- Lower reproducibility per single run (a failure may depend on the random category/product chosen).
- Higher debugging effort when trying to replay the exact same execution path.
- Uneven category distribution in short runs (one run may over-sample a category).

Mitigation for reproducibility risk:

- The suite resolves a run-level seed in `checkout.spec.ts` and prints it at the end of the suite run.
- If no seed is provided, one is generated automatically.
- To replay a failing random path, rerun with the same seed value.

How to set `PW_RANDOM_SEED`:

- Option 1 (single run, inline command):

   `PW_RANDOM_SEED=123456 npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --project=chromium`

- Option 2 (persistent local default, `.env` file at repository root):

   `PW_RANDOM_SEED=123456`

   The suite reads this value from `.env` when `process.env` is not already populated.

Why these risks are acceptable for this assessment:

- The goal is robust end-to-end behavior validation under realistic site variation.
- Static assertions are still used for core contracts (alerts, success confirmation).
- The suite keeps deterministic flow checks after selection by asserting against the actual selected product data.

## How To Run

From the repository root:

1. Install dependencies

   `npm install`

2. Install Playwright browsers

   `npm run pw:install`

3. Run all Playwright tests

   `npm run pw:run`

4. Run this suite only

   `npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --project=chromium`

   Optional deterministic replay:

   `PW_RANDOM_SEED=123456 npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --project=chromium`

5. Run by tag

   `npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --grep @AC1`

   `npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --grep @AC2`

   `npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --grep @AC3`

   `npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --grep @regression`

6. Run in headed mode

   `npx playwright test playwright/jedaureusGonzales/checkout.spec.ts --project=chromium --headed`

7. Open the latest HTML report

   `npx playwright show-report`

## Traceability Matrix

| Acceptance Criterion | Coverage | Test Name | Tag |
|---|---|---|---|
| AC1: Guest checkout end-to-end | Home navigation, random category selection, random available product selection, add to cart, checkout form completion, success confirmation | [AC1] Guest checkout full purchase journey | @AC1 |
| AC2: Authenticated checkout end-to-end | Valid login, random category selection, random available product selection, add to cart, checkout completion, success confirmation | [AC2] Authenticated user checkout full purchase journey | @AC2 |
| AC3: Invalid login | Non-existent user login rejected with expected alert | [AC3] Invalid login with a non-existent user should show the expected alert | @AC3 |
| AC3: Empty checkout form | Purchase blocked when required fields are missing | [AC3] Empty checkout form should be rejected before the order is submitted | @AC3 |
| AC3: Additional negative #1 | Existing username with wrong password is rejected | [AC3] Login with the right username and wrong password should be rejected | @AC3 |
| AC3: Additional negative #2 | Empty login credentials are rejected | [AC3] Empty login credentials should be rejected | @AC3 |
| AC3: Additional negative #3 | Duplicate sign-up is rejected with explicit alert | [AC3] Duplicate signup should be rejected with a clear alert | @AC3 |
| AC3: Additional negative #4 | Missing credit card blocks checkout | [AC3] Checkout with a missing credit card should be rejected | @AC3 |
| Regression coverage | Category filter and product page load work for a randomly selected available product | Category filtering should show the expected catalog item | @regression |
| Regression coverage | Cart preserves name and price for the randomly selected product | Cart should keep the selected product name and price | @regression |

## Design Notes

- Test data is centralized to avoid hard-coded values in test bodies.
- POM methods keep tests readable and focused on behavior.
- Assertions avoid generic truthy checks and validate explicit expected outcomes.
- The suite includes practical synchronization around known DemoBlaze timing issues without adding brittle sleep-based waits.
- Product assertions are based on runtime-selected product data to keep checks valid even when catalog content changes.

## Known Environment Behavior

DemoBlaze can intermittently respond slowly. The suite includes retry-aware API setup and resilient UI synchronization to reduce false negatives while preserving realistic user flows.