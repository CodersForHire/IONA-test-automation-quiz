import { test, expect } from './fixtures';
import { buildCheckoutDetails, PRODUCT_ADDED_MESSAGES } from './data/testData';

/**
 * Acceptance Criteria #1 - Checkout Flow (Guest)
 * "Automate the full purchase journey without being logged in":
 *   Navigate to the homepage -> select a product from any category ->
 *   add it to the cart -> proceed to checkout and fill in the purchase
 *   form -> assert the order success confirmation appears.
 */
test.describe('Guest checkout journey (AC #1)', () => {
  const productName = 'Samsung galaxy s6';
  const productPrice = 360;

  test('an unauthenticated visitor can browse, add a product, and complete checkout', async ({
    home,
    product,
    cart,
    checkout,
  }) => {
    const checkoutDetails = buildCheckoutDetails();

    await test.step('Navigate to the homepage as a guest', async () => {
      await home.goto();
      await expect(home.loginNavLink).toBeVisible();
      await expect(home.signupNavLink).toBeVisible();
      await expect(home.logoutNavLink).toBeHidden();
    });

    await test.step('Select a product from a category', async () => {
      await home.selectCategory('Phones');
      await home.selectProduct(productName);
    });

    await test.step('Add the product to the cart', async () => {
      const message = await product.addToCart();
      expect(PRODUCT_ADDED_MESSAGES).toContain(message);
    });

    await test.step('Proceed to checkout with the purchase form', async () => {
      await cart.goto();
      await expect(cart.rowFor(productName)).toBeVisible();
      await expect(cart.totalPrice).toHaveText(String(productPrice));
      await cart.openCheckout();
    });

    await test.step('Fill in name, country, city, credit card, month and year, then purchase', async () => {
      await checkout.fill(checkoutDetails);
      const alertMessage = await checkout.submit();
      expect(alertMessage, 'Purchase should succeed, not raise a validation alert').toBeNull();
    });

    await test.step('Assert the order success confirmation appears', async () => {
      await expect(checkout.successHeading).toBeVisible();
      for (const fragment of [checkoutDetails.name, checkoutDetails.card, String(productPrice)]) {
        await expect(checkout.successDetails).toContainText(fragment);
      }
    });
  });
});
