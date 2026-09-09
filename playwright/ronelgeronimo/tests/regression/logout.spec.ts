import { expect, hasCredentials, test } from '../../src/fixtures/auth.fixture';

/**
 * REGRESSION — the other end of the session lifecycle.
 *
 * login-positive.spec.ts proves a session can be created through the form and
 * survives a reload; this proves it can be ended and does NOT survive one.
 * Together they close the loop: without this, every authenticated spec starts
 * from a restored session and nothing ever puts one back.
 *
 * It starts from the session the worker fixture saved rather than signing in
 * again — the sign-in is not what is under test here, and driving the form is
 * login-positive.spec.ts's job.
 *
 * Logging out clears the `tokenp_` cookie in this test's own context only. The
 * worker's saved storage state is written once, at sign-in, so the other
 * authenticated specs are unaffected; the auth fixture's cart cleanup tolerates
 * the missing token on the way out.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number.
 */
test.describe('Log out', () => {
  test.skip(
    !hasCredentials(),
    'No account configured. Copy .env.example to .env and set DEMOBLAZE_USER / DEMOBLAZE_PASS.',
  );

  test(
    'signs out and the session does not survive a reload',
    { tag: ['@regression'] },
    async ({ pm, testUser }) => {
      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      await test.step(`Verify the saved session signed in ${testUser.username}`, async () => {
        await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
      });

      await test.step('Log out', async () => {
        await pm.navBar.logOut();
      });

      await test.step('Verify the navbar is back to its signed-out state', async () => {
        await expect(pm.navBar.loginLink).toBeVisible();
        await expect(pm.navBar.signUpLink).toBeVisible();
        await expect(pm.navBar.welcomeFor(testUser.username)).toBeHidden();
      });

      await test.step('Reload the home page and verify the session is really gone', async () => {
        await pm.homePage.open();
        await expect(pm.navBar.welcomeFor(testUser.username)).toBeHidden();
        await expect(pm.navBar.loginLink).toBeVisible();
      });
    },
  );
});
