import { checkoutNegative as data } from '../../src/data';
import {
  ALERT,
  expect,
  loadCases,
  ORDER_CONFIRMATION_TITLE,
  test,
  type CheckoutNegativeCase,
  type Outcome,
} from '../../src/fixtures/page-manager.fixture';

/**
 * REGRESSION — acceptance criterion 3: the checkout form's handling of bad
 * input.
 *
 * The cases split by what the application is expected to do, so neither loop
 * needs to branch on its data:
 *
 *   refusals — DemoBlaze correctly rejects the order.
 *   accepted — DemoBlaze takes the order when it should not. These assert the
 *              behaviour that actually happens and carry a defect id, so the
 *              suite reports a product bug without going red for it.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number.
 */
const cases = loadCases<CheckoutNegativeCase>(data);

const refusals = cases.filter((c): c is Outcome<'alert'> => c.outcome.kind === 'alert');
const accepted = cases.filter(
  (c): c is Outcome<'purchaseAccepted'> => c.outcome.kind === 'purchaseAccepted',
);

const PRODUCT = { category: 'Phones', title: 'Sony xperia z5' } as const;

test.describe('Checkout with invalid input', () => {
  test.describe('orders the application refuses', () => {
    for (const testCase of refusals) {
      test(testCase.title, { tag: testCase.tags }, async ({ pm }) => {
        await test.step('Open the home page', async () => {
          await pm.homePage.open();
        });

        await test.step(`Filter the catalogue by "${PRODUCT.category}"`, async () => {
          await pm.homePage.selectCategory(PRODUCT.category);
        });

        const productPage = await test.step(
          `Open the product "${PRODUCT.title}"`,
          async () => pm.homePage.openProduct(PRODUCT.title),
        );

        await test.step(`Add "${PRODUCT.title}" to the cart`, async () => {
          expect(await productPage.addToCart()).toBe(ALERT.productAddedAsGuest);
        });

        await test.step('Open the cart', async () => {
          await pm.cartPage.open();
          await expect(pm.cartPage.rowFor(PRODUCT.title)).toBeVisible();
        });

        const orderModal = await test.step('Open the Place Order form', async () =>
          pm.cartPage.placeOrder());

        await test.step('Fill in the invalid checkout details', async () => {
          await orderModal.fill(testCase.details);
        });

        await test.step('Submit the purchase and capture the alert', async () => {
          const message = await orderModal.purchaseExpectingAlert();
          expect(message).toBe(testCase.outcome.message);
        });

        await test.step('Close the form and verify the basket survived', async () => {
          await expect(orderModal.purchaseButton).toBeVisible();
          await orderModal.closeButton.click();
          await expect(pm.cartPage.rowFor(PRODUCT.title)).toBeVisible();
        });
      });
    }
  });

  test.describe('orders the application should refuse but does not', () => {
    for (const testCase of accepted) {
      test(testCase.title, { tag: testCase.tags }, async ({ pm }) => {
        await test.step('Open the home page', async () => {
          await pm.homePage.open();
        });

        if (testCase.addProduct) {
          await test.step(`Filter the catalogue by "${PRODUCT.category}"`, async () => {
            await pm.homePage.selectCategory(PRODUCT.category);
          });

          const productPage = await test.step(
            `Open the product "${PRODUCT.title}"`,
            async () => pm.homePage.openProduct(PRODUCT.title),
          );

          await test.step(`Add "${PRODUCT.title}" to the cart`, async () => {
            expect(await productPage.addToCart()).toBe(ALERT.productAddedAsGuest);
          });
        }

        await test.step('Open the cart', async () => {
          await pm.cartPage.open();
          await expect(pm.cartPage.productRows).toHaveCount(testCase.addProduct ? 1 : 0);
        });

        const orderModal = await test.step('Open the Place Order form', async () =>
          pm.cartPage.placeOrder());

        await test.step('Fill in the invalid checkout details', async () => {
          await orderModal.fill(testCase.details);
        });

        await test.step('Submit the purchase', async () => {
          await orderModal.purchase();
        });

        // DEFECT: see the defect log in README.md. This assertion deliberately
        // records the CURRENT behaviour. When the bug is fixed this test fails,
        // which is the signal to rewrite it as a refusal case in
        // the environment's checkout-negative.json.
        await test.step(
          `Verify the order was accepted (DEFECT ${testCase.outcome.defect})`,
          async () => {
            await test.info().attach(`DEFECT ${testCase.outcome.defect}`, {
              body: testCase.outcome.shouldHaveBeen,
              contentType: 'text/plain',
            });

            await expect(pm.orderConfirmation.title).toHaveText(ORDER_CONFIRMATION_TITLE);

            const details = await pm.orderConfirmation.detailsText();
            expect(details).toContain(`Card Number: ${testCase.details.card}`);
            expect(details).toContain(`Name: ${testCase.details.name}`);
          },
        );
      });
    }

    /**
     * Not a data row. The loop above asserts the confirmation echoes back the
     * name and card it was given, and the whole point of this case is that it
     * does not: DemoBlaze checks the two fields are non-empty STRINGS, so a
     * space passes, and the order is recorded with neither.
     */
    test(
      'accepts a whitespace-only name and credit card',
      { tag: ['@regression'] },
      async ({ pm }) => {
        const details = {
          name: '   ',
          country: 'Philippines',
          city: 'Manila',
          card: '   ',
          month: '09',
          year: '2030',
        };

        await test.step('Open the home page', async () => {
          await pm.homePage.open();
        });

        await test.step(`Filter the catalogue by "${PRODUCT.category}"`, async () => {
          await pm.homePage.selectCategory(PRODUCT.category);
        });

        const productPage = await test.step(
          `Open the product "${PRODUCT.title}"`,
          async () => pm.homePage.openProduct(PRODUCT.title),
        );

        await test.step(`Add "${PRODUCT.title}" to the cart`, async () => {
          expect(await productPage.addToCart()).toBe(ALERT.productAddedAsGuest);
        });

        await test.step('Open the cart', async () => {
          await pm.cartPage.open();
          await expect(pm.cartPage.productRows).toHaveCount(1);
        });

        const orderModal = await test.step('Open the Place Order form', async () =>
          pm.cartPage.placeOrder());

        await test.step('Fill the name and card with spaces', async () => {
          await orderModal.fill(details);
        });

        await test.step('Submit the purchase', async () => {
          await orderModal.purchase();
        });

        // DEFECT: see the defect log in README.md. This assertion deliberately
        // records the CURRENT behaviour. When the bug is fixed this test fails,
        // which is the signal to rewrite it as a refusal case.
        await test.step('Verify the order was accepted with neither (DEFECT DB-006)', async () => {
          await test.info().attach('DEFECT DB-006', {
            body:
              'The order should be refused: neither a name nor a card number was ' +
              'given. purchaseOrder() only checks the fields are non-empty strings, ' +
              'so a single space satisfies both — and the confirmation comes back ' +
              'with an empty Name and an empty Card Number, which is an order ' +
              'nobody can be billed for or shipped to.',
            contentType: 'text/plain',
          });

          await expect(pm.orderConfirmation.title).toHaveText(ORDER_CONFIRMATION_TITLE);

          // Not merely "different from what was typed" — the confirmation
          // carries no name and no card at all.
          expect(await pm.orderConfirmation.field('Name')).toBe('');
          expect(await pm.orderConfirmation.field('Card Number')).toBe('');
        });
      },
    );
  });
});
