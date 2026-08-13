# Test Automation Assessment

Welcome to IONA! This repository is used to assess QA engineer candidates on their test automation skills. You may use either **Cypress** or **Playwright** — choose the framework you are most comfortable with. This is your time to shine, so make sure you are proud of what you submit before opening a pull request.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js**: Version 24.x LTS or higher (latest: 24.13.0)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
- **npm**: Comes with Node.js (version 10.0.0 or higher)
  - Verify installation: `npm --version`
- **Git**: For version control
  - Verify installation: `git --version`
- **Basic understanding of TypeScript**: Optional, but helpful for better IDE support and type safety

## Acceptance Criteria

The following test scenarios are **required**. Your tests must cover all three flows against the [DemoBlaze](https://www.demoblaze.com/) website.

### 1. Checkout Flow — Guest

Automate the full purchase journey without being logged in:

- Navigate to the homepage
- Select a product from any category
- Add the product to the cart
- Proceed to checkout and fill in the purchase form (name, country, city, credit card, month, year)
- Assert that the order success confirmation appears

### 2. Checkout Flow — Logged In User

Automate the full purchase journey as an authenticated user:

- Log in with valid credentials
- Select a product and add it to the cart
- Proceed to checkout and complete the purchase form
- Assert that the order success confirmation appears

### 3. Negative / Invalid Test Cases

Automate scenarios that verify the application handles bad input gracefully. At minimum, cover:

- **Invalid login**: Attempt to log in with incorrect credentials and assert the error alert message
- **Empty checkout form**: Proceed to checkout without filling in any fields and assert that the expected validation or browser behavior is triggered
- At least **one additional** negative scenario of your choice (e.g., adding no items before checkout, using an invalid card number format, etc.)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cypress-test-automation-quiz
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Your Branch

**Important**: Always work on your own branch.

```bash
git checkout -b your-name/date
```

**Branch Naming Convention**: Use your name followed by a brief description, for example:
- `john-doe/checkout-flow`

---

## Cypress

### Folder Structure

Create your own folder under `cypress/e2e/` using camelCase with your first and last name:

```
cypress/
  └── e2e/
      └── johnDoe/
          └── checkout.cy.ts
```

### Running Cypress

| Command | Description |
|---|---|
| `npm run cy:open` | Open the interactive Cypress Test Runner |
| `npm run cy:run` | Run all tests headlessly |
| `npm run cy:headed` | Run tests with the browser visible |

---

## Playwright

### Setup

After installing dependencies, install the Playwright browser binaries:

```bash
npm run pw:install
```

### Folder Structure

Create your own folder under `playwright/` using camelCase with your first and last name:

```
playwright/
  └── johnDoe/
      └── checkout.spec.ts
```

### Running Playwright

| Command | Description |
|---|---|
| `npm run pw:open` | Open the interactive Playwright UI mode |
| `npm run pw:run` | Run all tests headlessly |
| `npm run pw:headed` | Run tests with the browser visible |

---

## Test Website

This assessment uses **[DemoBlaze](https://www.demoblaze.com/)** as the target application.

DemoBlaze is a demo e-commerce website that includes:

- **Product Catalog**: Phones, Laptops, and Monitors
- **Shopping Cart**: Add and remove products
- **User Authentication**: Sign up and login
- **Checkout**: Purchase form with order confirmation

---

## Committing and Pushing

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "Add checkout flow tests."

# Push your branch
git push origin your-branch-name
```

**Commit Message Best Practices**:
- Use clear, descriptive messages
- Start with a verb: Add, Fix, Update, Remove
- Keep messages concise but informative

---

## Project Structure

```
cypress-test-automation-quiz/
├── README.md
├── package.json
├── tsconfig.json                    # TypeScript config for Cypress
├── cypress.config.ts                # Cypress configuration
├── playwright.config.ts             # Playwright configuration
├── cypress/
│   ├── e2e/
│   │   └── [yourName]/              # Your Cypress test folder
│   │       └── checkout.cy.ts
│   ├── fixtures/
│   │   └── example.json
│   └── support/
│       ├── commands.ts
│       └── e2e.ts
├── playwright/
│   ├── tsconfig.json                # TypeScript config for Playwright
│   └── [yourName]/                  # Your Playwright test folder
│       └── checkout.spec.ts
└── .github/
    └── workflows/
        ├── cypress-tests.yml
        └── playwright-tests.yml
```

---

Happy Testing!
