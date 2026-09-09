import type { LocatorGroup } from '../../locator.types';

/**
 * The shopping cart at /cart.html.
 *
 * Read by pages/cart.page.ts, which holds no selectors of its own. Several of
 * these are deliberately scoped — the comments say against what, because
 * resolving them against the page instead is what makes a cart test flaky.
 */
export const CART_PAGE_LOCATORS = {
  table: { role: 'table' },
  productRows: { role: 'row', has: { role: 'link', name: 'Delete' } },
  // Matched on the row's text. A product re-added to the cart gets a SECOND row
  // rather than a merged one (verified on the live cart), so a title that
  // appears twice resolves to two rows and cannot be clicked. That is why
  // CartPage.emptyCart() works by row index and not by title.
  productRow: {
    role: 'row',
    has: { role: 'link', name: 'Delete' },
    hasText: '{{title}}',
  },
  deleteLink: { role: 'link', name: 'Delete', exact: true },
  // Positional because the cells carry nothing else to go on: a row is
  // image / title / price / Delete, and only the image and the link have any
  // identity of their own.
  rowTitleCell: { role: 'cell', nth: 1 },
  // The cart's only h3. The page's other headings are the "Products" and
  // "Total" h2s and the footer's, so the level identifies it without #totalp.
  total: { css: '#totalp' },
  placeOrderButton: { role: 'button', name: 'Place Order' },
} as const satisfies LocatorGroup;
