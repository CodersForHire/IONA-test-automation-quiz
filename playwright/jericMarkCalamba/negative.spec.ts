import { test, expect } from './fixtures';
import {
  INVALID_USER,
  MESSAGES,
  PRODUCT_ADDED_MESSAGES,
  buildCheckoutDetails,
  generateNewUser,
} from './data/testData';
import { ensureUserRegistered } from './support/apiHelpers';

/**
 * Acceptance Criteria #3 - Negative / Invalid Test Cases
 * "Automate scenarios that verify the application handles bad input
 * gracefully." Covers the two required cases (invalid login, empty
 * checkout form) plus four additional negative scenarios.
 *
 * Every test below gets its own isolated Playwright browser context (via
 * the built-in `page` fixture), so none of them depend on cart/session
 * state left over by another test, and any dynamically-created accounts
 * are generated per test (see data/testData.ts#generateNewUser) so the
 * suite can be re-run against DemoBlaze's shared backend indefinitely
 * without username collisions.
 */

test.describe('Invalid login (AC #3, required)', () => {
  test('logging in with credentials that do not exist shows an error alert', async ({ home, login }) => {
    await home.goto();
    await home.openLoginModal();

    const message = await login.login(INVALID_USER.username, INVALID_USER.password);

    expect(message).toBe(MESSAGES.userDoesNotExist);
    // The app should not have logged us in.
    await expect(home.loginNavLink).toBeVisible();
    await expect(home.signupNavLink).toBeVisible();
    await expect(home.logoutNavLink).toBeHidden();
  });
});

test.describe('Empty checkout form (AC #3, required)', () => {
  test('submitting the purchase form with every field blank is rejected', async ({
    home,
    product,
    cart,
    checkout,
  }) => {
    await home.goto();
    await home.selectCategory('Phones');
    await home.selectProduct('Samsung galaxy s6');

    const addedMessage = await product.addToCart();
    expect(PRODUCT_ADDED_MESSAGES).toContain(addedMessage);

    await cart.goto();
    await cart.openCheckout();

    // Deliberately leave Name, Country, City, Credit card, Month and Year blank.
    const message = await checkout.submit();

    expect(message).toBe(MESSAGES.fillNameAndCard);
    // The order modal should still be open - no purchase went through.
    await expect(checkout.purchaseButton).toBeVisible();
  });
});

test.describe('Additional negative scenarios (AC #3, at least 3 required - 4 provided)', () => {
  test('wrong password for an existing account is rejected with the expected alert', async ({
    request,
    home,
    login,
  }) => {
    // Arrange: register a real account via the API (this test is about
    // login, not sign-up - see support/apiHelpers.ts#ensureUserRegistered)
    // so the negative case is a genuine "wrong password", not a disguised
    // "user does not exist".
    const user = generateNewUser();
    await ensureUserRegistered(request, user.username, user.password);

    await home.goto();
    await home.openLoginModal();
    const message = await login.login(user.username, 'a-completely-wrong-password');

    expect(message).toBe(MESSAGES.wrongPassword);
    await expect(home.loginNavLink).toBeVisible();
    await expect(home.signupNavLink).toBeVisible();
    await expect(home.logoutNavLink).toBeHidden();
  });

  test('proceeding to checkout with no items in the cart still lets Purchase go through at $0', async ({
    home,
    cart,
    checkout,
  }) => {
    // DemoBlaze does not block checkout on an empty cart - this test
    // documents that known gap rather than assuming it is blocked, per
    // the acceptance criteria's own "adding no items before checkout" example.
    const checkoutDetails = buildCheckoutDetails();
    await home.goto();

    await cart.goto();
    await expect(cart.rows).toHaveCount(0);
    await cart.openCheckout();

    await checkout.fill({ name: checkoutDetails.name, card: checkoutDetails.card });
    const message = await checkout.submit();

    expect(message, 'Empty-cart purchase currently succeeds instead of being blocked (known app gap)').toBeNull();
    await expect(checkout.successHeading).toBeVisible();
    await expect(checkout.successDetails).toContainText('Amount: 0 USD');
  });

  test('an invalid (non-numeric) credit card format is still accepted without crashing', async ({
    home,
    product,
    cart,
    checkout,
  }) => {
    // DemoBlaze performs no format validation on the credit card field -
    // it only checks that Name and Credit card are non-empty. This test
    // asserts the app "handles bad input gracefully" in the sense the
    // acceptance criteria asks for: no crash, no broken state - while
    // documenting that format validation itself is a gap in the app.
    const invalidCard = 'NOT-A-CARD-NUMBER';
    const checkoutDetails = buildCheckoutDetails({ card: invalidCard });
    await home.goto();
    await home.selectCategory('Phones');
    await home.selectProduct('Samsung galaxy s6');

    const addedMessage = await product.addToCart();
    expect(PRODUCT_ADDED_MESSAGES).toContain(addedMessage);

    await cart.goto();
    await cart.openCheckout();

    await checkout.fill({ name: checkoutDetails.name, card: checkoutDetails.card });
    const message = await checkout.submit();

    expect(message).toBeNull();
    await expect(checkout.successHeading).toBeVisible();
    await expect(checkout.successDetails).toContainText(`Card Number: ${invalidCard}`);
  });

  test('signing up with an already-registered username is rejected', async ({ home, signup }) => {
    // This test IS about sign-up itself, so - unlike the other tests in
    // this file - it deliberately keeps using the real Sign Up modal for
    // both attempts rather than the API-based setup helper.
    const user = generateNewUser();
    await home.goto();
    await home.openSignupModal();

    const firstAttempt = await signup.signUp(user.username, user.password);
    expect(firstAttempt).toBe(MESSAGES.signUpSuccessful);

    await home.openSignupModal();
    const secondAttempt = await signup.signUp(user.username, user.password);
    expect(secondAttempt).toBe(MESSAGES.userAlreadyExists);
  });
});
