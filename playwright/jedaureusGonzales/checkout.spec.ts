import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { AuthModal } from './pages/authModal';
import { CartPage } from './pages/cartPage';
import { HomePage } from './pages/homePage';
import { OrderModal } from './pages/orderModal';
import { ProductPage } from './pages/productPage';
import { alertMessages, createOrderData, pickRandomCategory, type Credentials } from './data/testData';
import { createUniqueCredentials, signUpUser } from './utils/demoblazeApi';
import { resolveRandomSeed } from './utils/randomSeed';

test.describe('DemoBlaze checkout coverage', () => {
  const randomSeed = resolveRandomSeed();
  faker.seed(randomSeed);
  const orderData = createOrderData();

  test.afterAll(async () => {
    console.log(`Random seed used in this run: ${randomSeed}`);
  });

  test.setTimeout(120000);
  let registeredUser: Credentials | undefined;

  async function getRegisteredUser(request: Parameters<typeof signUpUser>[0]): Promise<Credentials> {
    if (!registeredUser) {
      registeredUser = createUniqueCredentials('checkout');
      await signUpUser(request, registeredUser);
    }

    return registeredUser;
  }

  test('[AC1] Guest checkout full purchase journey', { tag: ['@AC1'] }, async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const orderModal = new OrderModal(page);

    // Browse the catalog as a guest and complete checkout.
    await homePage.goto();
    const selectedProduct = await homePage.openRandomProductFromCategory(pickRandomCategory());
    await productPage.expectLoaded(selectedProduct.productName, selectedProduct.productId);
    await productPage.addToCart(alertMessages.productAdded);
    await homePage.openCart();
    await cartPage.expectProduct(selectedProduct.productName, selectedProduct.price);
    await cartPage.openPlaceOrder();
    await orderModal.fill(orderData.guest);
    await orderModal.purchase();
    await orderModal.expectSuccess();
    await orderModal.expectConfirmationDetails(selectedProduct.price);
  });

  test('[AC2] Authenticated user checkout full purchase journey', { tag: ['@AC2'] }, async ({ page }) => {
    const registeredShopper = await getRegisteredUser(page.request);
    const homePage = new HomePage(page);
    const authModal = new AuthModal(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const orderModal = new OrderModal(page);

    // Authenticate with a valid account before purchasing.
    await homePage.goto();
    await homePage.openLogin();
    await authModal.login(registeredShopper);
    await homePage.expectSignedInUser(registeredShopper.username);
    const selectedProduct = await homePage.openRandomProductFromCategory(pickRandomCategory());
    await productPage.expectLoaded(selectedProduct.productName, selectedProduct.productId);
    await productPage.addToCart(alertMessages.productAdded);
    await homePage.openCart();
    await cartPage.expectProduct(selectedProduct.productName, selectedProduct.price);
    await cartPage.openPlaceOrder();
    await orderModal.fill(orderData.authenticated);
    await orderModal.purchase();
    await orderModal.expectSuccess();
    await orderModal.expectConfirmationDetails(selectedProduct.price);
  });

  test.describe('[AC3] Negative scenarios', { tag: ['@AC3'] }, () => {
    test('[AC3] Invalid login with a non-existent user should show the expected alert', async ({ page }) => {
      const homePage = new HomePage(page);
      const authModal = new AuthModal(page);

      await homePage.goto();
      await homePage.openLogin();
      await authModal.loginExpectAlert(
        { username: createUniqueCredentials('missing-user').username, password: 'WrongPassword!' },
        alertMessages.invalidUser,
      );
    });

    test('[AC3] Empty checkout form should be rejected before the order is submitted', async ({ page }) => {
      const homePage = new HomePage(page);
      const productPage = new ProductPage(page);
      const cartPage = new CartPage(page);
      const orderModal = new OrderModal(page);

      await homePage.goto();
      await homePage.openRandomProductFromCategory(pickRandomCategory());
      await productPage.addToCart(alertMessages.productAdded);
      await homePage.openCart();
      await cartPage.openPlaceOrder();
      await orderModal.purchaseExpectAlert(alertMessages.incompletePurchase);
    });

    test('[AC3] Login with the right username and wrong password should be rejected', async ({ page }) => {
      const registeredShopper = await getRegisteredUser(page.request);
      const homePage = new HomePage(page);
      const authModal = new AuthModal(page);

      await homePage.goto();
      await homePage.openLogin();
      await authModal.loginExpectAlert(
        { username: registeredShopper.username, password: 'WrongPassword!' },
        alertMessages.wrongPassword,
      );
    });

    test('[AC3] Empty login credentials should be rejected', async ({ page }) => {
      const homePage = new HomePage(page);
      const authModal = new AuthModal(page);

      await homePage.goto();
      await homePage.openLogin();
      await authModal.loginExpectAlert({ username: '', password: '' }, alertMessages.emptyLogin);
    });

    test('[AC3] Duplicate signup should be rejected with a clear alert', async ({ page, request }) => {
      const homePage = new HomePage(page);
      const authModal = new AuthModal(page);
      const duplicateUser = createUniqueCredentials('duplicate');

      await signUpUser(request, duplicateUser);
      await homePage.goto();
      await homePage.openSignUp();
      await authModal.signUpExpectAlert(duplicateUser, alertMessages.duplicateUser);
    });

    test('[AC3] Checkout with a missing credit card should be rejected', async ({ page }) => {
      const homePage = new HomePage(page);
      const productPage = new ProductPage(page);
      const cartPage = new CartPage(page);
      const orderModal = new OrderModal(page);

      await homePage.goto();
      await homePage.openRandomProductFromCategory(pickRandomCategory());
      await productPage.addToCart(alertMessages.productAdded);
      await homePage.openCart();
      await cartPage.openPlaceOrder();
      await orderModal.fill({
        ...orderData.guest,
        creditCard: '',
      });
      await orderModal.purchaseExpectAlert(alertMessages.incompletePurchase);
    });
  });

  test.describe('Regression tests', () => {
    test('Category filtering should show the expected catalog item', { tag: ['@regression'] },async ({ page }) => {
      const homePage = new HomePage(page);
      const productPage = new ProductPage(page);

      await homePage.goto();
      const selectedProduct = await homePage.openRandomProductFromCategory(pickRandomCategory());
      await productPage.expectLoaded(selectedProduct.productName, selectedProduct.productId);
    });

    test('Cart should keep the selected product name and price', { tag: ['@regression'] }, async ({ page }) => {
      const homePage = new HomePage(page);
      const productPage = new ProductPage(page);
      const cartPage = new CartPage(page);

      await homePage.goto();
      const selectedProduct = await homePage.openRandomProductFromCategory(pickRandomCategory());
      await productPage.addToCart(alertMessages.productAdded);
      await homePage.openCart();
      await cartPage.expectProduct(selectedProduct.productName, selectedProduct.price);
    });
  });
});