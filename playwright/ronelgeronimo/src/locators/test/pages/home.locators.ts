import { itemsWithin } from '../../locator.factories';
import type { LocatorGroup } from '../../locator.types';
const PRODUCT_GRID = '#tbodyid';
const PRODUCT_CARD_LINK = 'a.hrefch';
export const HOME_PAGE_LOCATORS = {
  categoriesHeading: { role: 'link', name: 'CATEGORIES' },
  categoryLink: { role: 'link', name: '{{category}}', exact: true },
  productLink: { role: 'link', name: '{{title}}', exact: true },
  productCards: itemsWithin(PRODUCT_GRID, PRODUCT_CARD_LINK),
} as const satisfies LocatorGroup;
