import type { LocatorGroup } from '../locator.types';
import {
  LOGIN_MODAL_LOCATORS,
  NAV_BAR_LOCATORS,
  ORDER_CONFIRMATION_LOCATORS,
  ORDER_MODAL_LOCATORS,
  SIGN_UP_MODAL_LOCATORS,
} from './component.locators';
import { CART_PAGE_LOCATORS } from './pages/cart.locators';
import { HOME_PAGE_LOCATORS } from './pages/home.locators';
import { PRODUCT_PAGE_LOCATORS } from './pages/product.locators';

/**
 * The complete locator set for the `staging` environment.
 *
 * No selector is written here. Each page object's locators live in their own
 * file under pages/, and the shared components' — the nav bar, the modals, the
 * confirmation overlay — in component.locators.ts. This file only names the
 * groups, so that one map exists per environment for index.ts to select from.
 *
 * `test` is the reference set: index.ts derives the `Locators` shape from it
 * and requires this file to match it group for group and element for element,
 * so a rename made there and forgotten here is a compile error rather than a
 * locator that silently never matches.
 *
 * Adding a page object is therefore a new file under pages/ and one line here,
 * repeated in each environment folder. Page objects still read the selected set
 * from index.ts rather than importing these files, so the environment always
 * decides.
 */
export const STAGING_LOCATORS = {
  navBar: NAV_BAR_LOCATORS,
  homePage: HOME_PAGE_LOCATORS,
  productPage: PRODUCT_PAGE_LOCATORS,
  cartPage: CART_PAGE_LOCATORS,
  loginModal: LOGIN_MODAL_LOCATORS,
  signUpModal: SIGN_UP_MODAL_LOCATORS,
  orderModal: ORDER_MODAL_LOCATORS,
  orderConfirmation: ORDER_CONFIRMATION_LOCATORS,
} as const satisfies Record<string, LocatorGroup>;
