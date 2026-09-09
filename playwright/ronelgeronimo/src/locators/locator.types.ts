import type { Locator, Page } from '@playwright/test';

/**
 * Locators as data.
 *
 * A `LocatorSpec` describes HOW to find an element without holding a Playwright
 * `Locator`, so the description can live in one file, be swapped per
 * environment, and still be type-checked. `resolve()` turns a spec into a real
 * locator against a page or a parent locator.
 *
 * Nothing here changes the locator STRATEGY — role and accessible name first,
 * ids and CSS only where the markup makes role-based addressing ambiguous. It
 * changes only where the strategy is written down.
 */

export type Scope = Page | Locator;

export type AriaRole = Parameters<Page['getByRole']>[0];

export type LocatorParams = Record<string, string | number>;

interface Refinement {
  readonly hasText?: string;
  readonly has?: LocatorSpec;
  readonly nth?: number;
  /**
   * Resolve this spec INSIDE another one.
   *
   * `has` filters — "the row that contains a Delete link" — and still returns
   * the row. `within` descends: "the link inside the product-title heading"
   * returns the link. That is what lets a group be addressed by role all the
   * way down instead of falling back to a CSS path.
   */
  readonly within?: LocatorSpec;
}

export type LocatorSpec = Refinement &
  (
    | {
        readonly role: AriaRole;
        readonly name?: string | RegExp;
        readonly exact?: boolean;
        /** Heading level, for the `heading` role. */
        readonly level?: number;
      }
    | { readonly label: string; readonly exact?: boolean }
    | { readonly placeholder: string; readonly exact?: boolean }
    | { readonly text: string; readonly exact?: boolean }
    | { readonly testId: string }
    | { readonly css: string }
  );

export type LocatorGroup = Readonly<Record<string, LocatorSpec>>;
