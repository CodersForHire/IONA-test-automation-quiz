import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutModal } from '../pages/CheckoutModal';
import { LoginModal } from '../pages/LoginModal';
import { NavBar } from '../pages/NavBar';
import { captureDialogs, DialogCapture } from './dialogs';
import { ensureUserExists, loginViaApi } from './auth';
import { Credentials, testUserBase } from '../test-data/users';

/**
 * Custom `test` with page objects, dialog capture and the test user as
 * fixtures. Import `test`/`expect` from here instead of '@playwright/test'.
 */

interface WorkerFixtures {
  /**
   * A DemoBlaze account that is guaranteed to exist: signed up via the
   * site's /signup API at the start of every run (already-exists is fine),
   * since the demo database may be reset at any time.
   */
  registeredUser: Credentials;
}

interface TestFixtures {
  dialogs: DialogCapture;
  nav: NavBar;
  home: HomePage;
  product: ProductPage;
  cart: CartPage;
  checkout: CheckoutModal;
  loginModal: LoginModal;
  /** Logs the browser context in as `registeredUser` via the API, skipping the UI. */
  loginAsRegisteredUser: () => Promise<void>;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  registeredUser: [
    async ({ playwright }, use, workerInfo) => {
      // One account per worker so parallel tests never share a server-side cart.
      const user: Credentials = {
        username: `${testUserBase.username}.w${workerInfo.parallelIndex}`,
        password: testUserBase.password,
      };
      const api = await playwright.request.newContext();
      await ensureUserExists(api, user);
      await api.dispose();
      await use(user);
    },
    { scope: 'worker' },
  ],

  // Always attached: the site raises native alerts in most flows.
  dialogs: [
    async ({ page }, use) => {
      await use(captureDialogs(page));
    },
    { auto: true },
  ],

  nav: async ({ page }, use) => {
    await use(new NavBar(page));
  },
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
    await use(new CheckoutModal(page));
  },
  loginModal: async ({ page }, use) => {
    await use(new LoginModal(page));
  },

  loginAsRegisteredUser: async ({ request, context, registeredUser }, use) => {
    await use(() => loginViaApi(request, context, registeredUser));
  },
});

export { expect };
