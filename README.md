# Mike Beron - Cypress Test Automation Assessment

End-to-end test automation for the DemoBlaze e-commerce application using **Cypress** and **TypeScript**.

The suite covers the required authenticated and guest purchase journeys, negative validation scenarios, and regression coverage across authentication, product, cart, and checkout functionality.

The implementation prioritizes:

- Clear requirement-to-test traceability
- Deterministic and isolated test execution
- Maintainable page and workflow abstractions
- Explicit UI and business outcome validation
- Network-based synchronization where applicable
- Separation of test data and sensitive configuration
- Selective execution through test tagging
- Actionable HTML reporting and failure evidence

## Prerequisites

- Node.js 24.x LTS or later
- npm 10+
- Google Chrome
- Git

Verify the local environment:

```bash
node --version
npm --version
git --version
```

## Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/mikeberon/IONA-test-automation-quiz.git
cd IONA-test-automation-quiz
npm install
```

## Test Credentials

Authentication credentials are intentionally separated from test code and test data.

Create `cypress.env.json` in the project root:

```json
{
  "username": "<username>",
  "password": "<password>"
}
```

`cypress.env.json` is excluded from source control through `.gitignore`.

Authentication tests retrieve only the required credentials through `cy.env()` with Cypress logging disabled for sensitive values. The deprecated `Cypress.env()` API is disabled through the Cypress configuration.

For CI/CD execution, credentials should be injected through the CI platform's secret management capability rather than stored in repository configuration.

## Project Structure

```text
cypress/
├── e2e/
│   └── mikeBeron/
│       ├── authentication.cy.ts
│       ├── checkout.cy.ts
│       └── regression.cy.ts
├── fixtures/
│   ├── customer.json
│   └── products.json
└── support/
    ├── helpers/
    │   └── cart.ts
    ├── pages/
    │   ├── cartPage.ts
    │   ├── homePage.ts
    │   ├── loginPage.ts
    │   └── productPage.ts
    ├── commands.ts
    └── e2e.ts
```

### Responsibilities

| Area | Responsibility |
|---|---|
| `authentication.cy.ts` | Authentication scenarios and validation |
| `checkout.cy.ts` | Authenticated/guest checkout and negative checkout scenarios |
| `regression.cy.ts` | Product and cart regression coverage |
| `fixtures/` | Reusable, non-sensitive test data |
| `pages/` | Page-specific selectors, interactions, and state validation |
| `helpers/cart.ts` | Reusable add-to-cart workflow |
| `commands.ts` | Cross-cutting Cypress commands such as login and controlled input |

The framework intentionally uses a lightweight abstraction model. Page objects own page-specific behavior, shared workflows coordinate reusable cross-page actions, and specs retain scenario intent and business-level expectations.

## Test Coverage and Traceability

| Requirement | TC | Automated Scenario |
|---|---|---|
| Authenticated purchase journey | TC-02 | Complete checkout as an authenticated user |
| Guest purchase journey | TC-03 | Complete checkout as a guest |
| Invalid login | TC-04 | Reject login with an incorrect password |
| Empty checkout form | TC-05 | Prevent checkout when required fields are empty |
| Additional negative scenario | TC-06 | Prevent checkout when credit card is empty |
| Additional negative scenario | TC-07 | Prevent checkout when customer name is empty |
| Additional negative scenario | TC-08 | Reject login when username and password are empty |
| Regression | TC-01 | Display the homepage |
| Regression | TC-09 | Log in with valid credentials |
| Regression | TC-10 | Display the correct product details |
| Regression | TC-11 | Add a product to the cart and verify the total |
| Regression | TC-12 | Remove a product from the cart |

## Running the Tests

Run the complete suite in headless Chrome:

```bash
npm run cy:run
```

Run the complete suite with Chrome visible:

```bash
npm run cy:headed
```

Open the Cypress Test Runner:

```bash
npm run cy:open
```

Run a specific spec:

```bash
npm run cy:run -- --spec "cypress/e2e/mikeBeron/checkout.cy.ts"
```

## Tagged Execution

`@cypress/grep` is used to support targeted execution by test purpose.

```bash
npm run test:smoke
npm run test:regression
npm run test:negative
npm run test:checkout
npm run test:authentication
```

Current tag coverage:

| Tag | Test Cases |
|---|---|
| `@smoke` | TC-01, TC-02, TC-03 |
| `@regression` | TC-01, TC-09, TC-10, TC-11, TC-12 |
| `@negative` | TC-04, TC-05, TC-06, TC-07, TC-08 |
| `@positive` | TC-02, TC-03, TC-09 |
| `@authentication` | TC-02, TC-04, TC-08, TC-09 |
| `@checkout` | TC-02, TC-03, TC-05, TC-06, TC-07 |
| `@cart` | TC-11, TC-12 |

## Reporting

The suite uses `cypress-mochawesome-reporter` for HTML execution reporting.

The report provides:

- Suite and test results
- Pass/fail status
- Execution duration
- Summary charts
- Failure details
- Embedded screenshots for failed tests

Cypress is configured to capture screenshots automatically on failure:

```typescript
screenshotOnRunFailure: true
```

Passing tests do not generate screenshots. This keeps reporting focused on actionable failure evidence rather than producing unnecessary runtime artifacts.

Video recording is disabled for this assessment.

Generated reports, screenshots, and videos are treated as runtime artifacts and are excluded from source control.

## Implementation Notes

### Page Object Model

The suite uses a lightweight Page Object Model to centralize selectors and page-level interactions while keeping scenario intent visible in the specifications.

Page responsibilities are separated as follows:

- `HomePage` - homepage navigation, store validation, and product selection
- `ProductPage` - product detail validation and add-to-cart interaction
- `CartPage` - cart state, cart operations, checkout interactions, and purchase confirmation
- `LoginPage` - login modal interactions and authentication state

Reusable flows that span application areas are kept outside individual page objects. The add-to-cart helper, for example, coordinates the product selection and add-to-cart operation while leaving cart navigation and scenario-specific assertions to the consuming test.

This avoids duplicating selectors and interactions without introducing abstractions that are unnecessary for the current scope.

### Test Data and Secrets

Reusable non-sensitive test data is separated from test logic:

- `fixtures/customer.json` - checkout customer data
- `fixtures/products.json` - product name and expected price
- `cypress.env.json` - local authentication credentials

Credentials are intentionally excluded from fixtures and source control.

This separation allows test data to remain versioned while sensitive configuration can be supplied independently per execution environment.

### Input Handling

During execution, DemoBlaze intermittently dropped characters from login and checkout input fields.

The behavior was reproduced before introducing a targeted input strategy.

The custom `typeSlowly()` command:

- Clears and validates the initial field state
- Enters the value incrementally
- Re-queries the field between inputs
- Validates the final field value

This isolates the application-specific behavior in one reusable command and avoids introducing arbitrary fixed waits throughout the suite.

### Add-to-Cart Flow

The shared add-to-cart workflow is implemented in `support/helpers/cart.ts`.

The operation validates two independent success indicators:

1. The native confirmation alert contains the expected `Product added` message.
2. The `POST /addtocart` request completes with HTTP 200.

Network synchronization is used instead of a fixed delay:

```typescript
cy.intercept('POST', '**/addtocart').as('addToCart')

cy.wait('@addToCart')
    .its('response.statusCode')
    .should('eq', 200)
```

The helper intentionally does not navigate to the cart. Consuming scenarios explicitly open the cart and validate the expected product state.

This keeps helper side effects limited and makes navigation and business assertions visible at the scenario level.

### Alert Handling

During execution, two variants of the DemoBlaze add-to-cart confirmation were observed:

- `Product added.`
- `Product added`

This behavior was encountered across scenarios using the shared add-to-cart workflow:

- TC-02
- TC-03
- TC-05
- TC-06
- TC-07
- TC-11
- TC-12

The variation was not isolated to a specific test case. The assertion therefore accommodates the optional trailing period while continuing to validate the expected message:

```typescript
expect(message.trim()).to.match(/^Product added\.?$/)
```

The alert is not treated as the sole success condition. The workflow also validates the `POST /addtocart` response, while the consuming scenario subsequently validates the expected product state in the cart.

### Cart State and Test Isolation

DemoBlaze can persist cart contents between sessions, particularly for authenticated users.

TC-02 therefore establishes a known empty-cart state before adding the product under test. This prevents previously persisted cart items from affecting checkout totals or purchase confirmation validation.

Cart cleanup synchronizes against the application rather than relying on fixed delays:

- `POST /viewcart` determines the current cart contents.
- The rendered `Delete` control is awaited before performing the UI action.
- `POST /deleteitem` confirms completion of the deletion.
- Cart state is re-evaluated until no items remain.

The synchronization accounts for observed DemoBlaze behavior where the cart container can render before its asynchronously loaded product rows.

Negative checkout scenarios also remove the product they created after validating the expected error because those scenarios intentionally terminate before completing a purchase.

This maintains test isolation across repeated and full-suite executions.

### Purchase Validation

Successful checkout scenarios validate the resulting transaction rather than relying solely on the presence of a success dialog.

The purchase confirmation is validated for:

- `Thank you for your purchase!`
- Transaction amount

The reported amount must match the expected product price defined in the product fixture.

This provides a stronger business-level assertion by confirming that the expected transaction value was processed.

### Observed Application Validation Gaps

Additional negative scenarios were evaluated against the current DemoBlaze behavior before determining the final automated coverage.

#### Empty-Cart Checkout

Manual verification confirmed that DemoBlaze currently allows the checkout/purchase flow to proceed with no items in the cart.

A negative automated assertion was not added because the application does not currently enforce an empty-cart restriction.

#### Credit Card Format

Manual verification also confirmed that the checkout form accepts non-numeric and incorrectly formatted credit card values, including alphabetic characters, and still allows the purchase flow to proceed.

The application currently validates that the credit card field is populated but does not enforce an expected numeric format.

An automated test expecting invalid card formats to be rejected was therefore not added, as that assertion would not reflect the application's current behavior.

The three additional automated negative scenarios are covered by:

- TC-06 - checkout without a credit card
- TC-07 - checkout without a customer name
- TC-08 - login with both username and password empty

In a production delivery workflow, both the empty-cart checkout and missing credit card format validation would be raised for product/requirement clarification. If confirmed as violations of the intended business rules, they would be tracked as defects and automated once the expected behavior was defined.

## Test Strategy

The implementation is intentionally focused on the scope of the assessment while applying practices expected from a maintainable E2E automation suite:

- Requirement-to-test traceability through TC identifiers
- Positive, negative, smoke, and regression coverage
- Deterministic product selection
- Page-level selector ownership
- Reusable workflow abstraction where demonstrated
- Explicit business and UI assertions
- Network-based synchronization
- Test data separated from test logic
- Secrets excluded from source control
- Test isolation and cart-state management
- Selective execution through tags
- TypeScript static validation
- HTML reporting with failure evidence

Fixed waits are not used as synchronization mechanisms. Application state, Cypress retryability, explicit assertions, and observable network operations are used instead.

The framework is kept deliberately lightweight for the current application and assessment scope. Additional abstraction, cross-browser coverage, CI execution, and broader environment configuration would be introduced based on delivery requirements rather than preemptively.

## Verification

Final validation included TypeScript compilation and repeated full-suite execution:

```bash
npx tsc --noEmit
npm run cy:run
npm run cy:headed
```

TypeScript compilation completed without errors.

Final suite result:

```text
12 tests
12 passing
0 failing
```

The complete suite was also executed consecutively during final stability checks to confirm that persisted cart state from a previous run did not affect subsequent execution.

The suite completes without manual browser interaction.