import { test, expect } from './support/fixtures';
import { products } from './test-data/products';
import { validGuestCheckout, validAuthenticatedCheckout } from './test-data/checkoutData';

/**
 * AC-1 and AC-2 — Checkout flows.
 * Steps mirror the acceptance-criteria bullets one-to-one.
 */

// The public demo backend stalls at times; retries keep that from reading as a product failure.
test.describe.configure({ retries: 2, timeout: 60_000 });

test.describe('Checkout flow — Guest (AC-1)', () => {
  test(
    'guest can complete a full purchase journey without logging in',
    { tag: ['@AC-1', '@smoke'] },
    async ({ home, product, cart, checkout, dialogs }) => {
      const item = products.laptop;
      let cartItemId = '';

      await test.step('Navigate to the homepage', async () => {
        await home.goto();
      });

      await test.step('Select a product from any category', async () => {
        await home.selectCategory(item.category);
        await home.openProduct(item.name);
        await expect(product.productName).toHaveText(item.name);
      });

      await test.step('Add the product to the cart', async () => {
        cartItemId = await product.addToCart();
        await expect.poll(() => dialogs.messages).toContain('Product added');
      });

      await test.step('Proceed to checkout and fill in the purchase form', async () => {
        await cart.goto();
        // The guest cart is shared with every other anonymous visitor, so
        // assert on our own row only (see CartPage).
        const ourRow = cart.rowForCartItemId(cartItemId);
        await expect(ourRow).toBeVisible();
        await expect(ourRow).toContainText(item.name);

        await cart.placeOrder();
        await expect(checkout.modal).toBeVisible();
        await checkout.fill(validGuestCheckout);
        await checkout.purchase();
      });

      await test.step('Assert that the order success confirmation appears', async () => {
        await expect(checkout.confirmationHeading).toHaveText('Thank you for your purchase!');
        await expect(checkout.confirmationDetails).toContainText(`Name: ${validGuestCheckout.name}`);
        await expect(checkout.confirmationDetails).toContainText(`Card Number: ${validGuestCheckout.card}`);
        await checkout.dismissConfirmation();
      });
    },
  );
});

test.describe('Checkout flow — Logged in user (AC-2)', () => {
  test(
    'authenticated user can complete a full purchase journey',
    { tag: ['@AC-2', '@smoke'] },
    async ({ page, nav, home, product, cart, checkout, loginModal, registeredUser, dialogs }) => {
      const item = products.phone;

      await test.step('Log in with valid credentials', async () => {
        await home.goto();
        await nav.openLoginModal();
        await expect(loginModal.modal).toBeVisible();
        await loginModal.loginAs(registeredUser);
        await expect(nav.welcomeMessage).toHaveText(`Welcome ${registeredUser.username}`);
        await expect(nav.logoutLink).toBeVisible();
      });

      await test.step('Start from an empty cart', async () => {
        await cart.clearCart();
      });

      await test.step('Select a product and add it to the cart', async () => {
        await home.goto();
        await home.selectCategory(item.category);
        await home.openProduct(item.name);
        await expect(product.productName).toHaveText(item.name);
        await product.addToCart();
        await expect.poll(() => dialogs.messages).toContain('Product added.');
      });

      await test.step('Proceed to checkout and complete the purchase form', async () => {
        await cart.openWithItemCount(1);
        await expect(cart.rowForProduct(item.name)).toBeVisible();
        await expect(cart.totalPrice).toHaveText(String(item.price));

        await cart.placeOrder();
        await expect(checkout.modal).toBeVisible();
        await checkout.fill(validAuthenticatedCheckout);
        await checkout.purchase();
      });

      await test.step('Assert that the order success confirmation appears', async () => {
        await expect(checkout.confirmationHeading).toHaveText('Thank you for your purchase!');
        await expect(checkout.confirmationDetails).toContainText(`Amount: ${item.price} USD`);
        await expect(checkout.confirmationDetails).toContainText(`Name: ${validAuthenticatedCheckout.name}`);
        await expect(checkout.confirmationDetails).toContainText(`Card Number: ${validAuthenticatedCheckout.card}`);

        await checkout.dismissConfirmation();
        await expect(page).toHaveURL(/index\.html/);
      });
    },
  );
});
