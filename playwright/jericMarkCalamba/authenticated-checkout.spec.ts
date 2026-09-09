import { test, expect } from './fixtures';
import { generateNewUser, buildCheckoutDetails, PRODUCT_ADDED_MESSAGES } from './data/testData';
import { ensureUserRegistered } from './support/apiHelpers';

/**
 * Acceptance Criteria #2 - Checkout Flow (Logged In User)
 * "Automate the full purchase journey as an authenticated user":
 *   Log in with valid credentials -> select a product and add it to the
 *   cart -> proceed to checkout and complete the purchase form -> assert
 *   that the order success confirmation appears.
 *
 * The account used here is generated fresh for this one test run (see
 * data/testData.ts#generateNewUser) and registered directly against the
 * API (see support/apiHelpers.ts#ensureUserRegistered) rather than reusing
 * a shared, fixed account - per the team's conventions doc (§7/§12), a
 * test shouldn't depend on data another test, or a previous run, left
 * behind. A brand-new account also starts with a guaranteed-empty cart,
 * so there's no need for any cart-clearing step before adding a product.
 */
test.describe('Authenticated checkout journey (AC #2)', () => {
  const productName = 'Nexus 6';
  const productPrice = 650;

  test('a logged-in user can log in, add a product, and complete checkout', async ({
    request,
    home,
    product,
    cart,
    checkout,
    login,
  }) => {
    const user = generateNewUser();
    const checkoutDetails = buildCheckoutDetails();
    await ensureUserRegistered(request, user.username, user.password);

    await test.step('Log in with valid credentials', async () => {
      await home.goto();
      await home.openLoginModal();
      const result = await login.login(user.username, user.password);
      expect(result, 'Login should succeed for the freshly registered account').toBeNull();
      await expect(home.welcomeText).toHaveText(`Welcome ${user.username}`);
      await expect(home.logoutNavLink).toBeVisible();
      await expect(home.loginNavLink).toBeHidden();
    });

    await test.step('Select a product and add it to the cart', async () => {
      // A successful login triggers DemoBlaze's own page reload; navigate
      // explicitly rather than relying on that for clarity/robustness.
      await home.goto();
      await home.selectCategory('Phones');
      await home.selectProduct(productName);
      const message = await product.addToCart();
      expect(PRODUCT_ADDED_MESSAGES).toContain(message);
    });

    await test.step('Proceed to checkout', async () => {
      await cart.goto();
      await expect(cart.rowFor(productName)).toBeVisible();
      await expect(cart.rows).toHaveCount(1);
      await expect(cart.totalPrice).toHaveText(String(productPrice));
      await cart.openCheckout();
    });

    await test.step('Complete the purchase form', async () => {
      await checkout.fill(checkoutDetails);
      const alertMessage = await checkout.submit();
      expect(alertMessage, 'Purchase should succeed, not raise a validation alert').toBeNull();
    });

    await test.step('Assert that the order success confirmation appears', async () => {
      await expect(checkout.successHeading).toBeVisible();
      for (const fragment of [checkoutDetails.name, checkoutDetails.card, String(productPrice)]) {
        await expect(checkout.successDetails).toContainText(fragment);
      }
    });
  });
});
