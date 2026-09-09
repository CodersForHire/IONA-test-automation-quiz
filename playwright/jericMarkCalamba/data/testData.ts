import { faker } from '@faker-js/faker';

/**
 * Centralized test data for the DemoBlaze automation suite.
 *
 * This lives under `data/`, not `fixtures/`, deliberately: the team's
 * conventions doc (§6) reserves "fixture" for a Playwright
 * `test.extend()`-based dependency-injection setup (an authenticated
 * session, a seeded API context, etc.), and nothing below is that - these
 * are plain data generators and constants, matching §7's own
 * `data/factories/address.factory.ts` example far more closely than a
 * `.fixture.ts` file would.
 *
 * Keeping data here (rather than hard-coded inside specs) means:
 *  - Selectors/behaviors documented once, reused everywhere.
 *  - Every test generates its own account and purchase details rather
 *    than sharing one (see generateNewUser() / buildCheckoutDetails()),
 *    so tests stay independent and safe to run in any order or in
 *    parallel, and the suite can be re-run indefinitely against
 *    DemoBlaze's shared, persistent backend without collisions.
 */

/** Guaranteed not to exist - used for the "invalid login" negative test. */
export const INVALID_USER = {
  username: `no-such-user-${Date.now()}`,
  password: 'whatever-password',
};

/** Generates a brand-new, never-before-seen username/password pair. Every
 *  test that needs an account calls this itself rather than sharing one
 *  fixed account, so no test depends on state another test (or a
 *  previous run) left behind - see support/apiHelpers.ts#ensureUserRegistered. */
export function generateNewUser() {
  const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const humanPart = faker.internet.username().replace(/[^a-zA-Z0-9._-]/g, '');
  return {
    username: `${humanPart}_${unique}`,
    password: `Pwd_${unique}`,
  };
}

export interface CheckoutDetails {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

/** Generates well-formed, synthetic purchase-form data. Called fresh per
 *  test (see call sites in the specs) rather than shared as one constant,
 *  so no two tests assert on the same values by coincidence. Pass
 *  `overrides` to pin the specific fields a test cares about (e.g. an
 *  intentionally invalid credit card for a negative test) while still
 *  getting realistic synthetic data for the rest. */
export function buildCheckoutDetails(overrides: Partial<CheckoutDetails> = {}): CheckoutDetails {
  return {
    name: faker.person.fullName(),
    country: faker.location.country(),
    city: faker.location.city(),
    card: Array.from({ length: 16 }, () => faker.number.int({ min: 0, max: 9 })).join(''),
    month: String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0'),
    year: String(faker.date.future({ years: 3 }).getFullYear()),
    ...overrides,
  };
}

/**
 * DemoBlaze's own `addToCart()` function (js/prod.js) has two separate
 * code paths that both mean "successfully added" but use different exact
 * copy depending on whether a `tokenp_` session cookie is present at the
 * moment of the request:
 *   - guest / no token:   alert("Product added")    (no trailing period)
 *   - logged in / token:  alert("Product added.")   (trailing period)
 * This was confirmed by reading the deployed js/prod.js source directly,
 * not assumed - it's a genuine inconsistency in the app's own copy, not
 * test flakiness. Both strings are treated as a valid success confirmation;
 * see pages/product.page.ts#addToCart.
 */
export const PRODUCT_ADDED_MESSAGES = ['Product added', 'Product added.'];

/** Exact copy DemoBlaze shows for known interactions. Centralizing the
 *  strings means a real copy change only needs to be updated in one place. */
export const MESSAGES = {
  userDoesNotExist: 'User does not exist.',
  wrongPassword: 'Wrong password.',
  signUpSuccessful: 'Sign up successful.',
  userAlreadyExists: 'This user already exist.',
  fillNameAndCard: 'Please fill out Name and Creditcard.',
  purchaseSuccessHeading: 'Thank you for your purchase!',
};
