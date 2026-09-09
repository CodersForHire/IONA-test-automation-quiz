import {
  expect,
  hasCredentials,
  SIGN_IN_TIMEOUT,
  test,
} from '../../src/fixtures/auth.fixture';

/**
 * REGRESSION — the positive half of login. Acceptance criterion 2 opens with
 * "log in with valid credentials"; this is the test that actually does it.
 *
 * Every other authenticated spec starts from the session auth.fixture.ts saved,
 * which is what keeps a run to one sign-in instead of one per test. The cost of
 * that trade is that the login FORM would otherwise never be driven by a spec:
 * the fixture's own assertion proves a restored cookie works, not that a person
 * can type a username and a password and get in. This file pays that back.
 *
 * `test.use({ storageState: ... })` below throws the saved session away for this
 * file only, so it starts signed out. The ACCOUNT still comes from the auth
 * fixture's `testUser`, registered per worker by `ensureAccount()` — which is
 * why auth.fixture.ts registers in `workerUser` rather than alongside the
 * sign-in. Nothing here depends on a shared account a stranger on the public
 * demo could change.
 *
 * The negative half — unknown user, empty fields, duplicate sign-up — is
 * login-negative.spec.ts, which runs as a guest and needs no account at all.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number.
 */
test.describe('Valid login', () => {
  test.skip(
    !hasCredentials(),
    'No account configured. Copy .env.example to .env and set DEMOBLAZE_USER / DEMOBLAZE_PASS.',
  );

  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'signs in through the login form and keeps the session across a reload',
    { tag: ['@smoke', '@regression'] },
    async ({ pm, testUser }) => {
      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      await test.step('Verify nobody is signed in yet', async () => {
        await expect(pm.navBar.welcomeLabel).toBeHidden();
        await expect(pm.navBar.loginLink).toBeVisible();
      });

      const loginModal = await test.step('Open the Log in modal', async () =>
        pm.navBar.openLogin());

      await test.step(`Submit valid credentials for ${testUser.username}`, async () => {
        await loginModal.submit(testUser);
      });

      await test.step('Verify the login was accepted', async () => {
        await expect(loginModal.root).toBeHidden();
        await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible({
          timeout: SIGN_IN_TIMEOUT,
        });
        await expect(pm.navBar.loginLink).toBeHidden();
      });

      await test.step('Reload the home page and verify the session survived', async () => {
        await pm.homePage.open();
        await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
      });
    },
  );
});
