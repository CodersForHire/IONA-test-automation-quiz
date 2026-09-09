/**
 * Everything a spec needs that is NOT a page object.
 *
 * `pm` is already the single entry point to every page object and component, so
 * no spec imports a page class. This module is the same idea for the rest of the
 * spec surface: it is re-exported by fixtures/page-manager.fixture.ts and
 * fixtures/auth.fixture.ts, so a spec imports its dataset and its fixture
 * module, and nothing else.
 *
 *   import { cartManagement as data } from '../../src/data';
 *   import { ALERT, expect, loadCase, test, type SinglePurchaseCase }
 *     from '../../src/fixtures/page-manager.fixture';
 *
 * The dataset comes from data/index.ts rather than a JSON path, so the spec does
 * not know — and must not know — which environment's copy it was handed.
 *
 * The point is not the line count. It is that a spec no longer has to know which
 * util file a helper lives in, so moving `loadCase` or renaming `utils/messages`
 * touches this file rather than every test in the suite.
 *
 * WHAT BELONGS HERE. Things specs use: data loading, expected copy, case types.
 * Things page objects and fixtures use internally (locators/, utils/dates,
 * utils/cart-api) do NOT — a spec that reaches for those is a spec doing a page
 * object's job.
 *
 * utils/a11y.ts is the deliberate exception: only accessibility.spec.ts uses it,
 * and re-exporting it would pull @axe-core/playwright into the module graph of
 * every spec in every worker. That spec imports it directly.
 */

export { ensureAccount } from '../utils/account-api';
export { loadCase, loadCases } from '../utils/data';
export { hasCredentials } from '../utils/env';
export { ALERT, ORDER_CONFIRMATION_TITLE } from '../utils/messages';
export { uniqueUsername } from '../utils/test-data';

export type {
  AccessibilityCase,
  AddedProduct,
  CatalogueProduct,
  Category,
  CheckoutCase,
  CheckoutDetails,
  CheckoutNegativeCase,
  ConfirmationField,
  EmptiedCartCase,
  LoginNegativeCase,
  NegativeOutcome,
  Outcome,
  PartialRemovalCase,
  SinglePurchaseCase,
  TestUser,
} from '../utils/types';
