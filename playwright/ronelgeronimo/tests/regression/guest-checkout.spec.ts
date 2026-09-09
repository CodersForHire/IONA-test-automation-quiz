import { guestCheckout as data } from '../../src/data';
import {
  ALERT,
  expect,
  loadCases,
  ORDER_CONFIRMATION_TITLE,
  test,
  type CheckoutCase,
} from '../../src/fixtures/page-manager.fixture';

/**
 * REGRESSION — acceptance criterion 1: the guest purchase journey, one case per
 * product category.
 *
 * Every row in the data file runs here. The critical-path row is additionally
 * tagged @smoke, so `--grep @smoke` selects the subset without the suite being
 * split across folders to achieve it.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number, and the trace/HTML report reads as the
 * journey. Assertions sit in the step whose action they verify.
 */
const cases = loadCases<CheckoutCase>(data);

const DATE_TOLERANCE_MS = 48 * 60 * 60 * 1000;

test.describe('Guest checkout', () => {
  for (const testCase of cases) {
    test(testCase.title, { tag: testCase.tags }, async ({ pm }) => {
      await test.step('Open the home page', async () => {
        await pm.homePage.open();
      });

      await test.step('Verify nobody is signed in', async () => {
        await expect(pm.navBar.loginLink).toBeVisible();
        await expect(pm.navBar.welcomeLabel).toBeHidden();
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
        expect(await productPage.addToCart()).toBe(ALERT.productAddedAsGuest);
      });

      await test.step('Open the cart', async () => {
        await pm.cartPage.open();
        await expect(pm.cartPage.rowFor(testCase.product)).toBeVisible();
        await expect(pm.cartPage.productRows).toHaveCount(1);
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

      await test.step('Verify the confirmation carries an id and a date', async () => {
        expect(await pm.orderConfirmation.field('Id')).toMatch(/^\d+$/);

        const printed = (await pm.orderConfirmation.field('Date')) ?? '';
        expect(printed).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
        expect(
          Math.abs(Date.now() - new Date(printed).getTime()),
          `the confirmation is dated "${printed}"`,
        ).toBeLessThan(DATE_TOLERANCE_MS);
      });

      await test.step('Dismiss the confirmation', async () => {
        await pm.orderConfirmation.confirm();
        await expect(pm.orderConfirmation.root).toBeHidden();
      });

      await test.step('Reload the cart and verify it is empty', async () => {
        await pm.cartPage.open();
        await expect(pm.cartPage.productRows).toHaveCount(0);
      });
    });
  }
});
