import { test, expect } from './support/fixtures';
import { products } from './test-data/products';
import { validAuthenticatedCheckout } from './test-data/checkoutData';

/**
 * Minimum regression tests (assignment brief: "Include regression test cases").
 * Covers the behaviour the AC flows take for granted: catalogue, cart maths, session.
 */

// The public demo backend stalls at times; retries keep that from reading as a product failure.
test.describe.configure({ retries: 2, timeout: 60_000 });

test.describe('Catalogue', () => {
  test('category filter shows only that category\'s products', { tag: ['@regression'] }, async ({ home }) => {
    await home.goto();

    await home.selectCategory('Phones');
    await expect(home.productTiles.filter({ hasText: products.phone.name })).toBeVisible();
    await expect(home.productTiles.filter({ hasText: products.laptop.name })).toHaveCount(0);

    await home.selectCategory('Monitors');
    await expect(home.productTiles.filter({ hasText: products.monitor.name })).toBeVisible();
    await expect(home.productTiles.filter({ hasText: products.phone.name })).toHaveCount(0);
  });

  for (const item of Object.values(products)) {
    test(`product page shows the listed name and price for "${item.name}"`, { tag: ['@regression'] }, async ({ home, product }) => {
      await home.goto();
      await home.selectCategory(item.category);
      await home.openProduct(item.name);

      await expect(product.productName).toHaveText(item.name);
      expect(await product.readPrice()).toBe(item.price);
      await expect(product.addToCartLink).toBeVisible();
    });
  }
});

test.describe('Cart (logged in)', () => {
  test.beforeEach(async ({ loginAsRegisteredUser, cart }) => {
    await loginAsRegisteredUser();
    await cart.clearCart();
  });

  test('lists every added product and totals their prices', { tag: ['@regression'] }, async ({ home, product, cart }) => {
    const items = [products.phone, products.monitor];
    for (const item of items) {
      await home.goto();
      await home.selectCategory(item.category);
      await home.openProduct(item.name);
      await product.addToCart();
    }

    await cart.openWithItemCount(items.length);
    for (const item of items) {
      await expect(cart.rowForProduct(item.name)).toContainText(String(item.price));
    }
    await expect(cart.totalPrice).toHaveText(String(items.reduce((sum, item) => sum + item.price, 0)));
  });

  test('deleting a product removes its row and updates the total', { tag: ['@regression'] }, async ({ home, product, cart }) => {
    const keep = products.phone;
    const remove = products.laptop;
    for (const item of [keep, remove]) {
      await home.goto();
      await home.selectCategory(item.category);
      await home.openProduct(item.name);
      await product.addToCart();
    }

    await cart.openWithItemCount(2);
    await expect(cart.totalPrice).toHaveText(String(keep.price + remove.price));

    await cart.deleteProduct(remove.name);

    await cart.openWithItemCount(1);
    await expect(cart.rowForProduct(remove.name)).toHaveCount(0);
    await expect(cart.rowForProduct(keep.name)).toBeVisible();
    await expect(cart.totalPrice).toHaveText(String(keep.price));
  });

  test('completing a purchase empties the cart', { tag: ['@regression'] }, async ({ home, product, cart, checkout }) => {
    await home.goto();
    await home.selectCategory(products.monitor.category);
    await home.openProduct(products.monitor.name);
    await product.addToCart();

    await cart.openWithItemCount(1);
    await cart.placeOrder();
    await checkout.fill(validAuthenticatedCheckout);
    await checkout.purchase();
    await expect(checkout.confirmationHeading).toHaveText('Thank you for your purchase!');
    await checkout.dismissConfirmation();

    await cart.openWithItemCount(0);
  });
});

test.describe('Session', () => {
  test('logging out returns the site to the guest state', { tag: ['@regression'] }, async ({ loginAsRegisteredUser, home, nav, registeredUser }) => {
    await loginAsRegisteredUser();
    await home.goto();
    await expect(nav.welcomeMessage).toHaveText(`Welcome ${registeredUser.username}`);
    await expect(nav.loginLink).toBeHidden();

    await nav.logout();

    await expect(nav.loginLink).toBeVisible();
    await expect(nav.welcomeMessage).toBeHidden();
    await expect(nav.logoutLink).toBeHidden();
  });
});
