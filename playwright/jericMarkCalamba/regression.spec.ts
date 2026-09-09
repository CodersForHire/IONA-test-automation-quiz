import { test, expect } from './fixtures';
import { CartPage } from './pages/cart.page';
import { buildCheckoutDetails, PRODUCT_ADDED_MESSAGES, generateNewUser } from './data/testData';
import { ensureUserRegistered } from './support/apiHelpers';

/**
 * Regression suite - core behaviors that aren't spelled out as one of the
 * three acceptance criteria, but which a change to the cart, catalog or
 * auth flow could easily break. Kept in a separate file so it's obvious
 * this is "extra coverage" rather than acceptance-criteria traceability.
 */

test.describe('Catalog and navigation', () => {
  test('homepage loads with the product catalog visible', async ({ page, home }) => {
    await home.goto();

    await expect(page).toHaveTitle(/STORE/);
    await expect(home.productCards.first()).toBeVisible();
    await expect(home.loginNavLink).toBeVisible();
    await expect(home.signupNavLink).toBeVisible();
    await expect(home.logoutNavLink).toBeHidden();
  });

  test('switching category updates the product grid', async ({ page, home }) => {
    await home.goto();

    await home.selectCategory('Laptops');
    await expect(page.getByRole('link', { name: 'MacBook Pro', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Samsung galaxy s6', exact: true })).toBeHidden();

    await home.selectCategory('Phones');
    await expect(page.getByRole('link', { name: 'Samsung galaxy s6', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'MacBook Pro', exact: true })).toBeHidden();
  });
});

test.describe('Cart behavior', () => {
  test('adding a product shows a confirmation alert', async ({ home, product }) => {
    await home.goto();
    await home.selectCategory('Monitors');
    // Grab whichever monitor DemoBlaze lists first, so this test doesn't
    // hard-code a name that could change with the catalog.
    const firstMonitor = home.productCards.first();
    const monitorName = (await firstMonitor.innerText()).trim();
    await home.selectProduct(monitorName);

    const message = await product.addToCart();
    expect(PRODUCT_ADDED_MESSAGES).toContain(message);
  });

  test('adding multiple products sums their prices in the cart total', async ({ home, cart, product }) => {
    await home.goto();
    await home.selectCategory('Phones');
    await home.selectProduct('Samsung galaxy s6'); // $360
    expect(PRODUCT_ADDED_MESSAGES).toContain(await product.addToCart());

    await home.goto();
    await home.selectCategory('Phones');
    await home.selectProduct('Nokia lumia 1520'); // $820
    expect(PRODUCT_ADDED_MESSAGES).toContain(await product.addToCart());

    await cart.goto();
    await expect(cart.rows).toHaveCount(2);
    await expect(cart.totalPrice).toHaveText(String(360 + 820));
  });

  test('deleting a cart item removes it and recalculates the total', async ({ home, cart, product }) => {
    await home.goto();
    await home.selectCategory('Phones');
    await home.selectProduct('Samsung galaxy s6'); // $360
    expect(PRODUCT_ADDED_MESSAGES).toContain(await product.addToCart());

    await home.goto();
    await home.selectCategory('Phones');
    await home.selectProduct('Nexus 6'); // $650
    expect(PRODUCT_ADDED_MESSAGES).toContain(await product.addToCart());

    await cart.goto();
    await expect(cart.rows).toHaveCount(2);

    await cart.deleteProduct('Samsung galaxy s6');

    await expect(cart.rowFor('Samsung galaxy s6')).toHaveCount(0);
    await expect(cart.rows).toHaveCount(1);
    await expect(cart.totalPrice).toHaveText('650');
  });

  test('a completed purchase empties the cart', async ({ home, cart, product, checkout }) => {
    const checkoutDetails = buildCheckoutDetails();

    await home.goto();
    await home.selectCategory('Phones');
    await home.selectProduct('Samsung galaxy s6');
    expect(PRODUCT_ADDED_MESSAGES).toContain(await product.addToCart());

    await cart.goto();
    await cart.openCheckout();

    await checkout.fill(checkoutDetails);
    await checkout.submit();
    await expect(checkout.successHeading).toBeVisible();
    await checkout.confirmSuccess();

    await cart.goto();
    await expect(cart.rows).toHaveCount(0);
  });
});

test.describe('Authentication session', () => {
  test('logging out returns the app to a guest state', async ({ request, home, login }) => {
    const user = generateNewUser();
    await ensureUserRegistered(request, user.username, user.password);

    await home.goto();
    await home.openLoginModal();
    await login.login(user.username, user.password);
    await expect(home.welcomeText).toHaveText(`Welcome ${user.username}`);
    await expect(home.logoutNavLink).toBeVisible();
    await expect(home.loginNavLink).toBeHidden();

    await home.logout();
    await expect(home.loginNavLink).toBeVisible();
    await expect(home.signupNavLink).toBeVisible();
    await expect(home.logoutNavLink).toBeHidden();
  });
});

test.describe('Browser navigation', () => {
  test('the app recovers cleanly if the browser Back button is pressed while a modal is open', async ({
    page,
    home,
    cart,
  }) => {
    await home.goto();
    const homeUrl = page.url();

    await cart.goto();
    // Checkout opens fine on an empty cart on this app (see negative.spec.ts's
    // own "$0 checkout" test) - no need to add a product just to open the modal.
    await cart.openCheckout();

    // Verified live against the deployed site: Bootstrap's modal-open state
    // (a `modal-open` class on <body> plus a `.modal-backdrop` overlay) is
    // not part of browser history here, so pressing Back navigates the
    // whole page away rather than closing the modal in place. This test
    // guards against that modal state surviving the navigation - e.g. via
    // the back-forward cache - and leaving a phantom backdrop or a
    // scroll-locked <body> on the page the user lands back on.
    await page.goBack();

    expect(page.url()).toBe(homeUrl);
    await expect(page.locator('.modal-backdrop')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/modal-open/);

    // And the page is genuinely interactive, not just visually clean.
    await expect(home.productCards.first()).toBeVisible();
    await home.selectCategory('Phones');
    await expect(page.getByRole('link', { name: 'Samsung galaxy s6', exact: true })).toBeVisible();
  });
});

test.describe('Cart persistence', () => {
  test('a cart survives a reload and is visible from a second tab in the same session', async ({
    page,
    context,
    home,
    product,
    cart,
  }) => {
    await home.goto();
    await home.selectCategory('Monitors');
    const monitorName = (await home.productCards.first().innerText()).trim();
    await home.selectProduct(monitorName);
    expect(PRODUCT_ADDED_MESSAGES).toContain(await product.addToCart());

    await cart.goto();
    await expect(cart.rowFor(monitorName)).toBeVisible();

    // DemoBlaze ties the cart to a `user` cookie, not to any client-side
    // page state - verified live by inspecting document.cookie after
    // adding an item. A full reload should therefore show the exact same
    // row rather than an empty cart.
    await page.reload();
    await expect(cart.rowFor(monitorName)).toBeVisible();

    // A second tab opened in the SAME browser context shares that cookie
    // jar - also verified live - so it should see the identical cart
    // without ever adding anything itself. `context` is Playwright's
    // built-in fixture for the current test's BrowserContext; the fixtures
    // in ./fixtures are only wired to the primary `page`, so a page object
    // for this second page is constructed directly here.
    const secondPage = await context.newPage();
    const secondCart = new CartPage(secondPage);
    await secondCart.goto();
    await expect(secondCart.rowFor(monitorName)).toBeVisible();
    await secondPage.close();
  });
});
