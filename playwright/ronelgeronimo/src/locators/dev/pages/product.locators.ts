import type { LocatorGroup } from '../../locator.types';

/**
 * A single product at /prod.html?idp_=<id>.
 *
 * Read by pages/product.page.ts, which holds no selectors of its own.
 *
 * The title and price are addressed as headings rather than by class. Verified
 * against the live pages for Nexus 6, MacBook Pro and ASUS Full HD: a product
 * page carries exactly one h2 (the name) and exactly one h3 (the price), so the
 * level is what identifies them and `h2.name` / `h3.price-container` were
 * naming a stylesheet rather than the document.
 */
export const PRODUCT_PAGE_LOCATORS = {
  title: { role: 'heading', level: 2 },
  price: { role: 'heading', level: 3 },
  addToCartButton: { role: 'link', name: 'Add to cart' },
} as const satisfies LocatorGroup;
