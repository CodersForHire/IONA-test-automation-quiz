import { ENV, type EnvName } from '../utils/env';

import devAccessibility from './dev/accessibility.json';
import devAuthCheckout from './dev/auth-checkout.json';
import devCartManagement from './dev/cart-management.json';
import devCheckoutNegative from './dev/checkout-negative.json';
import devGuestCheckout from './dev/guest-checkout.json';
import devLoginNegative from './dev/login-negative.json';

import stagingAccessibility from './staging/accessibility.json';
import stagingAuthCheckout from './staging/auth-checkout.json';
import stagingCartManagement from './staging/cart-management.json';
import stagingCheckoutNegative from './staging/checkout-negative.json';
import stagingGuestCheckout from './staging/guest-checkout.json';
import stagingLoginNegative from './staging/login-negative.json';

import testAccessibility from './test/accessibility.json';
import testAuthCheckout from './test/auth-checkout.json';
import testCartManagement from './test/cart-management.json';
import testCheckoutNegative from './test/checkout-negative.json';
import testGuestCheckout from './test/guest-checkout.json';
import testLoginNegative from './test/login-negative.json';

/**
 * The test data for the environment this run is pointed at.
 *
 * Resolved once, at import, from TEST_ENV — the same variable that picks the
 * base URL, the timeouts and the locator set. Specs import a named dataset from
 * here rather than a path, so no spec knows which environment it is running as.
 *
 * Each environment owns a COMPLETE copy of every file under its own folder, the
 * same rule the locator layer follows. dev/, test/ and staging/ hold the same
 * six files and are free to diverge row by row — a different product catalogue
 * on staging, a different accessibility baseline on a fixed build.
 *
 * The imports are static on purpose. Reading these files by a path built from
 * ENV would work at run time but would type every dataset as `any`, and the
 * shapes below — `wcagTags`, `cases` — are what let a malformed row fail the
 * build instead of a test.
 */

type CaseFile = { readonly cases: readonly unknown[] };

type A11yFile = CaseFile & { readonly wcagTags: readonly string[] };

type JourneyFile = Readonly<Record<string, unknown>>;

interface DataSet {
  accessibility: A11yFile;
  authCheckout: CaseFile;
  cartManagement: JourneyFile;
  checkoutNegative: CaseFile;
  guestCheckout: CaseFile;
  loginNegative: CaseFile;
}

const DATA_SETS = {
  dev: {
    accessibility: devAccessibility,
    authCheckout: devAuthCheckout,
    cartManagement: devCartManagement,
    checkoutNegative: devCheckoutNegative,
    guestCheckout: devGuestCheckout,
    loginNegative: devLoginNegative,
  },
  test: {
    accessibility: testAccessibility,
    authCheckout: testAuthCheckout,
    cartManagement: testCartManagement,
    checkoutNegative: testCheckoutNegative,
    guestCheckout: testGuestCheckout,
    loginNegative: testLoginNegative,
  },
  staging: {
    accessibility: stagingAccessibility,
    authCheckout: stagingAuthCheckout,
    cartManagement: stagingCartManagement,
    checkoutNegative: stagingCheckoutNegative,
    guestCheckout: stagingGuestCheckout,
    loginNegative: stagingLoginNegative,
  },
} satisfies Record<EnvName, DataSet>;

const DATA = DATA_SETS[ENV];

export const accessibility = DATA.accessibility;
export const authCheckout = DATA.authCheckout;
export const cartManagement = DATA.cartManagement;
export const checkoutNegative = DATA.checkoutNegative;
export const guestCheckout = DATA.guestCheckout;
export const loginNegative = DATA.loginNegative;
