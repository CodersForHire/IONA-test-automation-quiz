import { loginNegative as data } from '../../src/data';
import {
  ALERT,
  ensureAccount,
  expect,
  loadCases,
  test,
  uniqueUsername,
  type LoginNegativeCase,
} from '../../src/fixtures/page-manager.fixture';

/**
 * REGRESSION — acceptance criterion 3: the invalid-login cases. An unknown
 * username, empty fields in each combination, a real account given the wrong
 * password, an empty sign-up, and a sign-up for a username already taken.
 *
 * Every case provisions whatever it needs, so none depends on a shared account
 * that a stranger on the public demo could change.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number.
 */
const cases = loadCases<LoginNegativeCase>(data);

const PASSWORD = 'C0rrect-horse-battery!';

test.describe('Invalid login', () => {
  for (const testCase of cases) {
    test(testCase.title, { tag: testCase.tags }, async ({ pm }) => {
      const username = testCase.username.replace(
        '{{unknownUser}}',
        uniqueUsername('nosuchuser'),
      );

      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      const loginModal = await test.step('Open the Log in modal', async () =>
        pm.navBar.openLogin());

      await test.step('Submit the credentials and capture the alert', async () => {
        const message = await loginModal.submitExpectingAlert({
          username,
          password: testCase.password,
        });

        expect(message).toBe(testCase.expectedAlert);
      });

      await test.step('Verify the login was rejected and can be retried', async () => {
        await expect(loginModal.submitButton).toBeVisible();
        await expect(pm.navBar.welcomeLabel).toBeHidden();
      });
    });
  }

  test(
    'rejects a valid username with the wrong password',
    { tag: ['@regression'] },
    async ({ pm, request }) => {
      const account = { username: uniqueUsername('ronelqa'), password: PASSWORD };

      // Registered over the API rather than through the sign-up modal: this case
      // is about the LOGIN form, and provisioning through the UI would make it
      // fail for a sign-up bug too — DB-003 among them.
      await test.step(`Register "${account.username}"`, async () => {
        await ensureAccount(request, account);
      });

      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      const loginModal = await test.step('Open the Log in modal', async () =>
        pm.navBar.openLogin());

      await test.step('Submit the account with the wrong password', async () => {
        const message = await loginModal.submitExpectingAlert({
          username: account.username,
          password: 'not-the-password',
        });

        expect(message).toBe(ALERT.wrongPassword);
      });

      await test.step('Verify the login was rejected and can be retried', async () => {
        await expect(loginModal.submitButton).toBeVisible();
        await expect(pm.navBar.welcomeLabel).toBeHidden();
      });
    },
  );

  test(
    'rejects a sign-up with no username and no password',
    { tag: ['@regression'] },
    async ({ pm }) => {
      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      const signUpModal = await test.step('Open the Sign up modal', async () =>
        pm.navBar.openSignUp());

      await test.step('Submit the form with both fields empty', async () => {
        expect(await signUpModal.submit({ username: '', password: '' })).toBe(
          ALERT.fillUsernameAndPassword,
        );
      });

      await test.step('Verify the sign-up was rejected and can be retried', async () => {
        await expect(signUpModal.submitButton).toBeVisible();
        await expect(pm.navBar.welcomeLabel).toBeHidden();
      });
    },
  );

  test(
    'rejects a sign-up for a username that is already taken',
    { tag: ['@regression'] },
    async ({ pm }) => {
      const username = uniqueUsername('ronelqa');

      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      const firstAttempt = await test.step('Open the Sign up modal', async () =>
        pm.navBar.openSignUp());

      await test.step(`Register "${username}"`, async () => {
        expect(await firstAttempt.submit({ username, password: PASSWORD })).toBe(
          ALERT.signUpSuccessful,
        );
        await expect(firstAttempt.root).toBeHidden();
      });

      // See DEFECT DB-003: the sign-up modal will not reopen after a successful
      // registration until the page is reloaded.
      await test.step('Reload the home page (DEFECT DB-003)', async () => {
        await pm.homePage.open();
      });

      const secondAttempt = await test.step('Reopen the Sign up modal', async () =>
        pm.navBar.openSignUp());

      await test.step(`Register "${username}" a second time`, async () => {
        expect(await secondAttempt.submit({ username, password: PASSWORD })).toBe(
          ALERT.userAlreadyExists,
        );
      });
    },
  );

  /**
   * The one case in this file the application does NOT reject. It is here rather
   * than with the refusals because it is the same question the others ask — what
   * does sign-up do with input it should not take — and the answer is that it
   * takes it.
   */
  test(
    'accepts a sign-up for a username padded with spaces',
    { tag: ['@regression'] },
    async ({ pm }) => {
      const username = uniqueUsername('ronelqa');
      const padded = `  ${username}  `;

      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      const signUpModal = await test.step('Open the Sign up modal', async () =>
        pm.navBar.openSignUp());

      await test.step(`Register "${padded}"`, async () => {
        expect(await signUpModal.submit({ username: padded, password: PASSWORD })).toBe(
          ALERT.signUpSuccessful,
        );
      });

      // See DEFECT DB-003: no modal reopens after a successful registration
      // until the page is reloaded.
      await test.step('Reload the home page (DEFECT DB-003)', async () => {
        await pm.homePage.open();
      });

      const loginModal = await test.step('Open the Log in modal', async () =>
        pm.navBar.openLogin());

      // DEFECT: see the defect log in README.md. This assertion deliberately
      // records the CURRENT behaviour — the padding is stored verbatim, so the
      // name the user believes they registered does not exist. When the bug is
      // fixed this test fails, which is the signal to rewrite it as a sign-up
      // that either trims the name or refuses it.
      await test.step(
        `Verify "${username}" was never created (DEFECT DB-009)`,
        async () => {
          await test.info().attach('DEFECT DB-009', {
            body:
              'Sign-up should trim the username, or refuse one that is only ' +
              'whitespace. DemoBlaze stores it verbatim, so "  name  " and "name" ' +
              'are two different accounts and a user who later types their name ' +
              'without the padding they did not know they entered can never sign ' +
              'in. The extreme case registers cleanly too: an account named with ' +
              'nothing but spaces already exists on the public demo.',
            contentType: 'text/plain',
          });

          const message = await loginModal.submitExpectingAlert({
            username,
            password: PASSWORD,
          });

          expect(message).toBe(ALERT.userDoesNotExist);
        },
      );
    },
  );
});
