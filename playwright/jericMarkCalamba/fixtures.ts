import { test as base } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { ProductPage } from './pages/product.page';
import { CartPage } from './pages/cart.page';
import { CheckoutModalComponent } from './pages/checkout-modal.component';
import { LoginModalComponent } from './pages/login-modal.component';
import { SignupModalComponent } from './pages/signup-modal.component';

/**
 * Page objects as Playwright fixtures, per the team's conventions doc (§6),
 * which reserves "fixture" specifically for `test.extend()`-based
 * dependency injection. Every spec in this suite used to construct its own
 * page objects by hand at the top of each test (`const home = new
 * HomePage(page)`, repeated near-identically everywhere); declaring them
 * here once means a test just asks for the ones it needs as named
 * parameters, e.g.:
 *
 *   test('...', async ({ home, cart, checkout }) => { ... });
 *
 * A test that needs a second page/context (e.g. to check cart state from a
 * second tab) still constructs that page object directly against its own
 * `page` instance - these fixtures are only wired to the fixture-provided
 * primary `page`.
 */
type PageObjects = {
  home: HomePage;
  product: ProductPage;
  cart: CartPage;
  checkout: CheckoutModalComponent;
  login: LoginModalComponent;
  signup: SignupModalComponent;
};

export const test = base.extend<PageObjects>({
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  product: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutModalComponent(page));
  },
  login: async ({ page }, use) => {
    await use(new LoginModalComponent(page));
  },
  signup: async ({ page }, use) => {
    await use(new SignupModalComponent(page));
  },
});

export { expect } from '@playwright/test';
