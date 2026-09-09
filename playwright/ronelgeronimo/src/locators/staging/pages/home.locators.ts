import type { LocatorGroup } from '../../locator.types';

/**
 * The product catalogue at /index.html.
 *
 * Read by pages/home.page.ts, which holds no selectors of its own. This is the
 * `staging` environment's copy: when another environment serves different markup the
 * fix is an edit to ITS copy under locators/<env>/, and this file is not touched.
 */
export const HOME_PAGE_LOCATORS = {
  categoriesHeading: { role: 'link', name: 'CATEGORIES' },
  categoryLink: { role: 'link', name: '{{category}}', exact: true },
  productLink: { role: 'link', name: '{{title}}', exact: true },
  // The grid's product links as a GROUP — the gate that the catalogue has
  // actually rendered. Each card titles itself with a link inside an h4, and
  // nothing else on the page does, so the pair identifies the group without
  // naming the grid's id or the cards' class.
  productCards: { role: 'link', within: { role: 'heading', level: 4 } },
} as const satisfies LocatorGroup;
