import type { LocatorGroup } from '../../locator.types';
export const PRODUCT_PAGE_LOCATORS = {
  title: { css: 'h2.name' },
  price: { css: 'h3.price-container' },
  addToCartButton: { role: 'link', name: 'Add to cart' },
} as const satisfies LocatorGroup;
