import {
  ALERT,
  expect,
  test,
  type CatalogueProduct,
  type CheckoutDetails,
} from '../../src/fixtures/page-manager.fixture';

/**
 * RECONSTRUCTED HEADER — the original was lost to a comment-cleanup pass before
 * it had been backed up. Rewrite or replace it; the tests below are untouched.
 *
 * REGRESSION — the Place Order form itself, rather than the orders it accepts
 * or refuses.
 *
 * checkout-negative.spec.ts covers what the application does with bad input.
 * This covers the form's own state: that it opens empty and asking for what the
 * cart totalled, that a refusal leaves every entered detail in place, that
 * dismissing it places no order and leaves the basket alone, and that reopening
 * it shows the previous attempt still filled in.
 *
 * That last one is DEFECT DB-007 and is asserted as the behaviour that actually
 * happens, so the suite reports the bug without going red for it.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number.
 */
const PRODUCT: CatalogueProduct = { category: 'Phones', product: 'Nokia lumia 1520' };

const DETAILS: Required<CheckoutDetails> = {
  name: 'Ronel Geronimo',
  country: 'Philippines',
  city: 'Manila',
  card: '4111111111111111',
  month: '09',
  year: '2030',
};

const EMPTY_FORM: Required<CheckoutDetails> = {
  name: '',
  country: '',
  city: '',
  card: '',
  month: '',
  year: '',
};

test.describe('Place Order form', () => {
  test('opens with every field empty and shows what the cart totals', {
    tag: ['@regression'],
  }, async ({ pm }) => {
    const [added] = await pm.cartPage.addProducts([PRODUCT]);

    await test.step('Verify the product was added as a guest', async () => {
      expect(added.alert).toBe(ALERT.productAddedAsGuest);
    });

    await test.step('Open the cart', async () => {
      await pm.cartPage.open();
      await expect(pm.cartPage.productRows).toHaveCount(1);
    });

    const orderModal = await test.step('Open the Place Order form', async () =>
      pm.cartPage.placeOrder());

    await test.step('Verify every field is empty', async () => {
      expect(await orderModal.values()).toEqual(EMPTY_FORM);
    });

    await test.step('Verify the form is asking for the cart total', async () => {
      await expect(orderModal.totalLabel).toContainText(String(added.price));
    });
  });

  test('keeps every detail entered when an order is refused', {
    tag: ['@regression'],
  }, async ({ pm }) => {
    await pm.cartPage.addProducts([PRODUCT]);

    await test.step('Open the cart', async () => {
      await pm.cartPage.open();
    });

    const orderModal = await test.step('Open the Place Order form', async () =>
      pm.cartPage.placeOrder());

    const entered: Required<CheckoutDetails> = {
      ...DETAILS,
      name: '',
      card: '',
    };

    await test.step('Fill in the address but neither name nor card', async () => {
      await orderModal.fill(entered);
    });

    await test.step('Submit the purchase and capture the alert', async () => {
      const message = await orderModal.purchaseExpectingAlert();
      expect(message).toBe(ALERT.fillNameAndCreditcard);
    });

    await test.step('Verify the refusal left every entered detail in place', async () => {
      expect(await orderModal.values()).toEqual(entered);
    });
  });

  test('closes without placing an order when the form is dismissed', {
    tag: ['@regression'],
  }, async ({ pm }) => {
    await pm.cartPage.addProducts([PRODUCT]);

    await test.step('Open the cart', async () => {
      await pm.cartPage.open();
    });

    const orderModal = await test.step('Open the Place Order form', async () =>
      pm.cartPage.placeOrder());

    await test.step('Fill in the checkout details', async () => {
      await orderModal.fill(DETAILS);
    });

    await test.step('Dismiss the form', async () => {
      await orderModal.closeButton.click();
      await expect(orderModal.root).toBeHidden();
    });

    await test.step('Verify no order was placed and the basket survived', async () => {
      await expect(pm.orderConfirmation.root).toBeHidden();
      await expect(pm.cartPage.rowFor(PRODUCT.product)).toBeVisible();
      await expect(pm.cartPage.productRows).toHaveCount(1);
    });
  });

  test('keeps the entered details after the form is dismissed and reopened', {
    tag: ['@regression'],
  }, async ({ pm }) => {
    await pm.cartPage.addProducts([PRODUCT]);

    await test.step('Open the cart', async () => {
      await pm.cartPage.open();
    });

    const firstOpen = await test.step('Open the Place Order form', async () =>
      pm.cartPage.placeOrder());

    await test.step('Fill in the checkout details', async () => {
      await firstOpen.fill(DETAILS);
    });

    await test.step('Dismiss the form', async () => {
      await firstOpen.closeButton.click();
      await expect(firstOpen.root).toBeHidden();
    });

    const reopened = await test.step('Open the Place Order form again', async () =>
      pm.cartPage.placeOrder());

    // DEFECT: see the defect log in README.md. This assertion deliberately
    // records the CURRENT behaviour — the form is never reset, so a dismissed
    // order leaves a full card number sitting in the page for the next person to
    // open it. When the bug is fixed this test fails, which is the signal to
    // rewrite it as an expectation of EMPTY_FORM.
    await test.step('Verify the form still holds the card details (DEFECT DB-007)', async () => {
      await test.info().attach('DEFECT DB-007', {
        body:
          'Dismissing the Place Order form should clear it. DemoBlaze never resets ' +
          'the inputs, so reopening it shows the previous attempt in full — the ' +
          'credit card number included — and those values are submitted with the ' +
          'next order unless they are typed over.',
        contentType: 'text/plain',
      });

      expect(await reopened.values()).toEqual(DETAILS);
    });
  });
});
