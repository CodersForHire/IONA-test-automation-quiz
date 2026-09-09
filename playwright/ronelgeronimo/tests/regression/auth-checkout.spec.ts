import { authCheckout as data } from '../../src/data';
import {
  ALERT,
  expect,
  hasCredentials,
  loadCases,
  ORDER_CONFIRMATION_TITLE,
  test,
  type CheckoutCase,
} from '../../src/fixtures/auth.fixture';

/**
 * REGRESSION — acceptance criterion 2: the authenticated purchase journey.
 *
 * These start already signed in, from the session the worker fixture saved, so
 * they exercise checkout rather than login. Driving the login form itself is
 * login-positive.spec.ts's job — it is the one spec that throws the saved
 * session away and signs in the long way.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number.
 */
const cases = loadCases<CheckoutCase>(data);

test.describe('Authenticated checkout', () => {
  test.skip(
    !hasCredentials(),
    'No account configured. Copy .env.example to .env and set DEMOBLAZE_USER / DEMOBLAZE_PASS.',
  );

  for (const testCase of cases) {
    test(testCase.title, { tag: testCase.tags }, async ({ pm, testUser }) => {
      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      await test.step(`Verify the saved session signed in ${testUser.username}`, async () => {
        await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
      });

      await test.step(`Filter the catalogue by "${testCase.category}"`, async () => {
        await pm.homePage.selectCategory(testCase.category);
        await expect(pm.homePage.productLink(testCase.product)).toBeVisible();
      });

      const productPage = await test.step(
        `Open the product "${testCase.product}"`,
        async () => {
          const product = await pm.homePage.openProduct(testCase.product);
          await expect(product.title).toHaveText(testCase.product);
          return product;
        },
      );

      const price = await test.step('Read the price on the product page', async () =>
        productPage.priceValue());

      await test.step(`Add "${testCase.product}" to the cart`, async () => {
        expect(await productPage.addToCart()).toBe(ALERT.productAddedWhenSignedIn);
      });

      await test.step('Open the cart', async () => {
        await pm.cartPage.open();
        await expect(pm.cartPage.rowFor(testCase.product)).toBeVisible();
        await expect(pm.cartPage.total).toHaveText(String(price));
      });

      const orderModal = await test.step('Open the Place Order form', async () =>
        pm.cartPage.placeOrder());

      await test.step('Fill in the checkout details', async () => {
        await orderModal.fill(testCase.details);
      });

      await test.step('Submit the purchase', async () => {
        await orderModal.purchase();
        await expect(pm.orderConfirmation.title).toHaveText(ORDER_CONFIRMATION_TITLE);
      });

      await test.step('Verify the confirmation echoes this order', async () => {
        const details = await pm.orderConfirmation.detailsText();
        expect(details).toContain(`Amount: ${price} USD`);
        expect(details).toContain(`Name: ${testCase.details.name}`);
        expect(details).toContain(`Card Number: ${testCase.details.card}`);
      });

      await test.step('Dismiss the confirmation', async () => {
        await pm.orderConfirmation.confirm();
        await expect(pm.orderConfirmation.root).toBeHidden();
      });

      await test.step('Reload the cart and verify it is empty and still signed in', async () => {
        await pm.cartPage.open();
        await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
        await expect(pm.cartPage.productRows).toHaveCount(0);
      });
    });
  }
});
