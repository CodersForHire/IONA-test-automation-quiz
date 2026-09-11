import { test, expect } from './support/fixtures';
import { invalidLogins } from './test-data/users';
import { validGuestCheckout, validAuthenticatedCheckout, invalidFormatCard } from './test-data/checkoutData';

/**
 * AC-3 — Negative / invalid input.
 * Required: invalid login, empty checkout form.
 * Additional: partially filled form (x2), invalid card format, empty cart.
 */

// The public demo backend stalls at times; retries keep that from reading as a product failure.
test.describe.configure({ retries: 2, timeout: 60_000 });

test.describe('Invalid login (AC-3)', () => {
  test.beforeEach(async ({ home, nav, loginModal }) => {
    await home.goto();
    await nav.openLoginModal();
    await expect(loginModal.modal).toBeVisible();
  });

  // Prerequisite: `registeredUser` is signed up fresh every run (see fixtures),
  // so the "valid username" cases hold even if the demo database was reset.
  for (const invalid of invalidLogins) {
    test(`rejects login with ${invalid.scenario}`, { tag: ['@AC-3', '@negative'] }, async ({ loginModal, nav, dialogs, registeredUser }) => {
      await loginModal.loginAs(invalid.credentials(registeredUser));

      // The site reports the failure in a native alert dialog.
      await expect.poll(() => dialogs.messages.at(-1), 'error alert message').toContain(invalid.expectedAlert);
      await expect(loginModal.modal, 'login modal should stay open after a rejected attempt').toBeVisible();
      await expect(nav.welcomeMessage, 'nav should not switch to the logged-in state').toBeHidden();
    });
  }
});

test.describe('Checkout form validation (AC-3)', () => {
  const requiredFieldsAlert = 'Please fill out Name and Creditcard.';

  test.beforeEach(async ({ cart, checkout }) => {
    await cart.goto();
    await cart.placeOrder();
    await expect(checkout.modal).toBeVisible();
  });

  test('rejects a completely empty checkout form', { tag: ['@AC-3', '@negative'] }, async ({ checkout, dialogs }) => {
    await checkout.purchase();

    await expect.poll(() => dialogs.messages).toContain(requiredFieldsAlert);
    await expect(checkout.modal, 'order modal should stay open').toBeVisible();
    await expect(checkout.confirmation, 'no order confirmation should appear').toBeHidden();
  });

  const partiallyFilled = [
    { scenario: 'name filled but credit card missing', data: { ...validGuestCheckout, card: '' } },
    { scenario: 'credit card filled but name missing', data: { ...validGuestCheckout, name: '' } },
  ];
  for (const { scenario, data } of partiallyFilled) {
    test(`rejects checkout with ${scenario}`, { tag: ['@AC-3', '@negative'] }, async ({ checkout, dialogs }) => {
      await checkout.fill(data);
      await checkout.purchase();

      await expect.poll(() => dialogs.messages).toContain(requiredFieldsAlert);
      await expect(checkout.modal).toBeVisible();
      await expect(checkout.confirmation).toBeHidden();
    });
  }

  test('rejects a credit card in an invalid format', { tag: ['@AC-3', '@negative', '@known-defect'] }, async ({ checkout }) => {
    await checkout.fill({ ...validGuestCheckout, card: invalidFormatCard });
    await checkout.purchase();

    // Known defect: the site accepts any non-empty card value. Asserting the
    // expected behaviour as an expected failure keeps the suite green and
    // flags the day it gets fixed. Declared after setup so setup errors still fail normally.
    test.fail(true, 'DemoBlaze accepts any non-empty string as a credit card number');
    test.info().annotations.push({ type: 'defect', description: 'No credit card format validation on the order form' });
    await expect(checkout.confirmation, 'an invalid card should not produce an order confirmation').toBeHidden();
  });
});

test.describe('Checkout with an empty cart (AC-3)', () => {
  test('rejects placing an order when the cart is empty', { tag: ['@AC-3', '@negative', '@known-defect'] }, async ({ loginAsRegisteredUser, cart, checkout }) => {
    // Only a logged-in cart can be emptied; the guest cart is shared (see CartPage).
    await loginAsRegisteredUser();
    await cart.clearCart();

    await cart.placeOrder();
    await expect(checkout.modal).toBeVisible();
    await checkout.fill(validAuthenticatedCheckout);
    await checkout.purchase();

    // Known defect: an empty cart can be purchased (Amount: 0 USD). See note above.
    test.fail(true, 'DemoBlaze confirms a purchase for an empty cart (Amount: 0 USD)');
    test.info().annotations.push({ type: 'defect', description: 'Order can be placed with an empty cart' });
    await expect(checkout.confirmation, 'an empty cart should not produce an order confirmation').toBeHidden();
  });
});
