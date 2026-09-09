/**
 * Shared types for the DemoBlaze suite.
 *
 * Every JSON data file is imported through one of these types, so a malformed
 * data row is a compile error rather than a confusing runtime failure.
 */

export interface EnvConfig {
  baseURL: string;
  retries: number;
  actionTimeout: number;
  navigationTimeout: number;
  expectTimeout: number;
}

export interface TestUser {
  username: string;
  password: string;
}

export interface CheckoutDetails {
  name?: string;
  country?: string;
  city?: string;
  card?: string;
  month?: string;
  year?: string;
}

export type Category = 'Phones' | 'Laptops' | 'Monitors';

interface DataCase {
  title: string;
  tags: string[];
}

export interface CheckoutCase extends DataCase {
  category: Category;
  product: string;
  details: Required<CheckoutDetails>;
}

export interface LoginNegativeCase extends DataCase {
  username: string;
  password: string;
  expectedAlert: string;
}

export type NegativeOutcome =
  | { kind: 'alert'; message: string }
  | { kind: 'purchaseAccepted'; defect: string; shouldHaveBeen: string };

export interface CheckoutNegativeCase extends DataCase {
  addProduct: boolean;
  details: CheckoutDetails;
  outcome: NegativeOutcome;
}

export type Outcome<K extends NegativeOutcome['kind']> = CheckoutNegativeCase & {
  outcome: Extract<NegativeOutcome, { kind: K }>;
};

export interface CatalogueProduct {
  category: Category;
  product: string;
}

export interface AddedProduct extends CatalogueProduct {
  price: number;
  alert: string;
}

export interface CartContents {
  titles: string[];
  total: number;
}

export type ConfirmationField = 'Id' | 'Amount' | 'Card Number' | 'Name' | 'Date';

export interface SinglePurchaseCase {
  purchase: CatalogueProduct;
  details: Required<CheckoutDetails>;
}

export interface PartialRemovalCase {
  add: CatalogueProduct[];
  remove: string[];
  details: Required<CheckoutDetails>;
}

/**
 * Cart-management journey 3 — fill a basket, empty it, then order anyway.
 *
 * Ends in the same DB-002 defect the checkout-negative suite records, reached
 * by a different route: a cart emptied by hand rather than one never filled.
 */
export interface EmptiedCartCase {
  add: CatalogueProduct[];
  details: Required<CheckoutDetails>;
  outcome: Extract<NegativeOutcome, { kind: 'purchaseAccepted' }>;
}

/**
 * One page an axe scan runs against, and how the spec is to reach it.
 *
 * A case names EITHER a `path` — a standing URL a user could type — or a
 * `category` and `product`, which the spec opens through the catalogue the way
 * a user does. The product page gets the second form because its only URL is
 * /prod.html?idp_=<id>, and that id is a database key: it is not stable across
 * environments, and a spec that hardcodes it asserts accessibility of whatever
 * that host happens to hold at id 1.
 *
 * The union is exclusive on purpose — a case that carried both would leave the
 * spec picking one and silently ignoring the other.
 */
export type AccessibilityCase = DataCase & {
  ready: string;
  baseline: Record<string, string>;
} & ({ path: string } | { category: Category; product: string });
