import { cartManagement as data } from '../../src/data';
import {
  ALERT,
  expect,
  hasCredentials,
  loadCase,
  ORDER_CONFIRMATION_TITLE,
  test,
  type EmptiedCartCase,
  type PartialRemovalCase,
  type SinglePurchaseCase,
} from '../../src/fixtures/auth.fixture';

/**
 * E2E — the three cart journeys, run SIGNED IN.
 *
 *   1. Buy a phone, paying through the whole checkout form
 *   2. Add a phone and two laptops, remove the phone and one laptop, buy the
 *      laptop that is left
 *   3. Add a phone, two laptops and three monitors, remove all six, order anyway
 *
 * The guest half of the pair is guest-scenarios.spec.ts. The two files are split
 * by FIXTURE — this one imports `test` from auth.fixture.ts — and the journeys
 * are written out in each rather than shared, which is the same trade the rest
 * of the suite makes (see README, "How a tier is built").
 *
 * Running both halves is not the same journey twice: DemoBlaze stores a guest
 * cart against an anonymous cookie and a member cart against the account,
 * through two different branches of `addToCart()`. DB-004 is the visible edge of
 * that — the same click alerts "Product added." here and "Product added" there.
 *
 * Signing in is done once per worker and reused through storageState, so these
 * tests start already authenticated — the login form itself is driven by
 * tests/regression/login-positive.spec.ts. The fixture also empties the cart
 * either side of every test, which matters more here than anywhere else: two of
 * these three journeys deliberately leave items in the basket for part of their
 * run, and all three share one account within the worker.
 *
 * Data is the environment's cart-management.json, reached as `cartManagement`
 * from src/data — the same three baskets both files use.
 *
 * Every page action is its own test.step, so a failure names the action that
 * broke rather than a line number.
 *
 * The spec holds no loops and derives nothing. Repetition (adding a basket,
 * removing several rows, emptying the cart) and derivation (what survives a
 * removal, the alerts a basket should raise, the titles it should leave behind)
 * are CartPage's job; the spec names the journey and asserts what came back.
 */
const buyPhone = loadCase<SinglePurchaseCase>(data.buyPhone);
const removeThenBuyLaptop = loadCase<PartialRemovalCase>(data.removeThenBuyLaptop);
const emptiedThenOrder = loadCase<EmptiedCartCase>(data.emptiedThenOrder);

test.describe('Cart journeys when signed in', () => {
  test.skip(
    !hasCredentials(),
    'No account configured. Copy .env.example to .env and set DEMOBLAZE_USER / DEMOBLAZE_PASS.',
  );

  test('buys a phone when signed in and pays through the full checkout form', {
    tag: ['@e2e', '@regression'],
  }, async ({ pm, testUser }) => {
    await test.step('Navigate to the home page', async () => {
      await pm.homePage.open();
    });

    await test.step(`Verify the saved session signed in ${testUser.username}`, async () => {
      await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
    });

    const [phone] = await pm.cartPage.addProducts([buyPhone.purchase]);

    await test.step('Verify the phone was added to the account cart', async () => {
      expect(phone.alert).toBe(ALERT.productAddedWhenSignedIn);
    });

    await test.step('Go to the cart', async () => {
      await pm.cartPage.open();
    });

    await test.step('Check the cart details', async () => {
      await expect(pm.cartPage.rowFor(buyPhone.purchase.product)).toBeVisible();
      await expect(pm.cartPage.productRows).toHaveCount(1);
      await expect(pm.cartPage.total).toHaveText(String(phone.price));
    });

    const orderModal = await pm.cartPage.placeOrderFor(phone.price);

    await test.step('Input the checkout details', async () => {
      await orderModal.fill(buyPhone.details);

      await expect(orderModal.nameInput).toHaveValue(buyPhone.details.name);
      await expect(orderModal.countryInput).toHaveValue(buyPhone.details.country);
      await expect(orderModal.cityInput).toHaveValue(buyPhone.details.city);
      await expect(orderModal.cardInput).toHaveValue(buyPhone.details.card);
      await expect(orderModal.monthInput).toHaveValue(buyPhone.details.month);
      await expect(orderModal.yearInput).toHaveValue(buyPhone.details.year);
    });

    await test.step('Submit the purchase', async () => {
      await orderModal.purchase();
      await expect(pm.orderConfirmation.title).toHaveText(ORDER_CONFIRMATION_TITLE);
    });

    await test.step('Verify the confirmation echoes this order', async () => {
      const details = await pm.orderConfirmation.detailsText();
      expect(details).toContain(`Amount: ${phone.price} USD`);
      expect(details).toContain(`Name: ${buyPhone.details.name}`);
      expect(details).toContain(`Card Number: ${buyPhone.details.card}`);
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

  test('removes the phone and one laptop from a three-item cart, then buys the laptop left', {
    tag: ['@e2e', '@regression'],
  }, async ({ pm, testUser }) => {
    await test.step('Navigate to the home page', async () => {
      await pm.homePage.open();
    });

    await test.step(`Verify the saved session signed in ${testUser.username}`, async () => {
      await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
    });

    const added = await pm.cartPage.addProducts(removeThenBuyLaptop.add);

    await test.step(`Verify all ${added.length} products were added`, async () => {
      expect(pm.cartPage.alertsOf(added)).toEqual(
        pm.cartPage.expectedAlerts(
          removeThenBuyLaptop.add,
          ALERT.productAddedWhenSignedIn,
        ),
      );
    });

    await test.step('Go to the cart and verify the whole basket is there', async () => {
      await pm.cartPage.open();
      expect(await pm.cartPage.contents(removeThenBuyLaptop.add.length)).toEqual(
        pm.cartPage.contentsOf(added),
      );
    });

    await pm.cartPage.removeProducts(removeThenBuyLaptop.remove);

    const expectedTotal = pm.cartPage.totalExcluding(added, removeThenBuyLaptop.remove);
    const expectedCart = pm.cartPage.contentsExcluding(added, removeThenBuyLaptop.remove);

    await test.step('Check the cart details', async () => {
      expect(await pm.cartPage.contents(expectedCart.titles.length)).toEqual(expectedCart);
    });

    const orderModal = await pm.cartPage.placeOrderFor(expectedTotal);

    await test.step('Input the checkout details', async () => {
      await orderModal.fill(removeThenBuyLaptop.details);
    });

    await test.step('Submit the purchase', async () => {
      await orderModal.purchase();
      await expect(pm.orderConfirmation.title).toHaveText(ORDER_CONFIRMATION_TITLE);
    });

    await test.step('Verify the confirmation echoes this order', async () => {
      const details = await pm.orderConfirmation.detailsText();
      expect(details).toContain(`Amount: ${expectedTotal} USD`);
      expect(details).toContain(`Name: ${removeThenBuyLaptop.details.name}`);
      expect(details).toContain(`Card Number: ${removeThenBuyLaptop.details.card}`);
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

  test('accepts an order after every item has been removed from a six-item cart', {
    tag: ['@e2e', '@regression'],
  }, async ({ pm, testUser }) => {
    await test.step('Navigate to the home page', async () => {
      await pm.homePage.open();
    });

    await test.step(`Verify the saved session signed in ${testUser.username}`, async () => {
      await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
    });

    const added = await pm.cartPage.addProducts(emptiedThenOrder.add);

    await test.step(`Verify all ${added.length} products were added`, async () => {
      expect(pm.cartPage.alertsOf(added)).toEqual(
        pm.cartPage.expectedAlerts(emptiedThenOrder.add, ALERT.productAddedWhenSignedIn),
      );
    });

    await test.step('Go to the cart and verify the whole basket is there', async () => {
      await pm.cartPage.open();
      expect(await pm.cartPage.contents(emptiedThenOrder.add.length)).toEqual(
        pm.cartPage.contentsOf(added),
      );
    });

    await pm.cartPage.emptyCart();

    await test.step('Check the cart details — reload and verify it is empty', async () => {
      await pm.cartPage.open();
      await expect(pm.cartPage.productRows).toHaveCount(0);
    });

    const orderModal = await test.step('Place the order', async () =>
      pm.cartPage.placeOrder());

    await test.step('Input the checkout details', async () => {
      await orderModal.fill(emptiedThenOrder.details);
    });

    await test.step('Submit the purchase', async () => {
      await orderModal.purchase();
    });

    // DEFECT: see the defect log in README.md. This assertion deliberately
    // records the CURRENT behaviour — an emptied cart still takes an order.
    // Reached here with an ACCOUNT cart rather than a guest one, which is the
    // reason this case is worth running on both sides of the pair: the order is
    // posted with the session token and is still accepted.
    // When the bug is fixed this test fails, which is the signal to rewrite it
    // as a refusal.
    await test.step(
      `Verify the emptied cart was still ordered (DEFECT ${emptiedThenOrder.outcome.defect})`,
      async () => {
        await test.info().attach(`DEFECT ${emptiedThenOrder.outcome.defect}`, {
          body: emptiedThenOrder.outcome.shouldHaveBeen,
          contentType: 'text/plain',
        });

        await expect(pm.orderConfirmation.title).toHaveText(ORDER_CONFIRMATION_TITLE);

        const details = await pm.orderConfirmation.detailsText();
        expect(details).toContain(`Name: ${emptiedThenOrder.details.name}`);
        expect(details).toContain(`Card Number: ${emptiedThenOrder.details.card}`);
      },
    );

    await test.step('Dismiss the confirmation', async () => {
      await pm.orderConfirmation.confirm();
      await expect(pm.orderConfirmation.root).toBeHidden();
    });

    await test.step('Reload the cart and verify it is still empty and still signed in', async () => {
      await pm.cartPage.open();
      await expect(pm.navBar.welcomeFor(testUser.username)).toBeVisible();
      await expect(pm.cartPage.productRows).toHaveCount(0);
    });
  });
});
