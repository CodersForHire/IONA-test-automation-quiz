import * as fs from 'node:fs';
import * as path from 'node:path';

import { ensureAccount } from '../utils/account-api';
import { authToken, emptyCart } from '../utils/cart-api';
import { AUTH_DIR, credentials, envConfig } from '../utils/env';
import type { TestUser } from '../utils/types';
import { expect, PageManager, test as base } from './page-manager.fixture';

/**
 * Authentication for the logged-in suite.
 *
 * Sign-in happens ONCE PER WORKER through the real UI; the resulting `tokenp_`
 * cookie is saved and every test in that worker starts from it. A run of N
 * authenticated tests performs one login, not N, while each test still gets its
 * own browser context and stays independent.
 *
 * DemoBlaze keeps its auth token in a cookie (index.js sets
 * `document.cookie = "tokenp_=" + token`), which is exactly what storageState
 * captures. A sessionStorage-based app would need a different approach.
 *
 * ACCOUNT PER WORKER. DemoBlaze hands out the same token for every login by a
 * given user, and the cart is stored against the user rather than the session —
 * so two workers signed in as the same account share one cart, and one test's
 * purchase empties another's basket mid-flight. Each worker therefore gets its
 * own account, named from the .env user (`<user>_w0`, `_w1`, ...). The names are
 * deterministic, so repeated runs reuse the same handful of accounts instead of
 * littering the demo with new ones.
 *
 * Reusing a session means the login FORM is never driven by a spec. The one
 * sign-in this suite performs is the worker fixture's own, below, and it asserts
 * that it took effect — so a broken login form fails the whole authenticated
 * suite at setup rather than passing unnoticed.
 */

export const SIGN_IN_TIMEOUT = envConfig.navigationTimeout;

interface AuthWorkerFixtures {
  workerUser: TestUser;
  workerStorageState: string;
}

interface AuthTestFixtures {
  testUser: TestUser;
  cartCleanup: void;
}

export const test = base.extend<AuthTestFixtures, AuthWorkerFixtures>({
  workerUser: [
    async ({ playwright }, use) => {
      const configured = credentials();
      const user: TestUser = {
        username: `${configured.username}_w${test.info().parallelIndex}`,
        password: configured.password,
      };

      const request = await playwright.request.newContext({
        baseURL: envConfig.baseURL,
      });
      await ensureAccount(request, user);
      await request.dispose();

      await use(user);
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ browser, workerUser }, use) => {
      const statePath = path.join(AUTH_DIR, `user-${test.info().parallelIndex}.json`);
      await fs.promises.mkdir(AUTH_DIR, { recursive: true });

      const page = await browser.newPage({
        baseURL: envConfig.baseURL,
        storageState: undefined,
      });

      const pm = new PageManager(page);
      await pm.homePage.open();

      const loginModal = await pm.navBar.openLogin();
      await loginModal.submit(workerUser);

      await expect(pm.navBar.welcomeFor(workerUser.username)).toBeVisible({
        timeout: SIGN_IN_TIMEOUT,
      });

      await page.context().storageState({ path: statePath });
      await page.close();

      await use(statePath);
    },
    { scope: 'worker' },
  ],

  storageState: async ({ workerStorageState }, use) => {
    await use(workerStorageState);
  },

  testUser: async ({ workerUser }, use) => {
    await use(workerUser);
  },

  cartCleanup: [
    async ({ context }, use) => {
      const empty = async (): Promise<void> => {
        const token = await authToken(context);
        if (!token) return;
        await emptyCart(context.request, token);
      };

      await empty();
      await use();
      await empty();
    },
    { auto: true },
  ],
});

export { expect };

export * from './spec-kit';
