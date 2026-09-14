import { test } from '../fixtures/pageFixtures';
import {
    checkoutCustomer,
    checkoutDataScenarios
} from '../test-data/checkoutData';
import { loginData } from '../test-data/loginData';

// Use only the first checkout scenario for the tests in this spec.
const { category, product } = checkoutDataScenarios[0];

test.describe('Checkout', () => {
    // Clean up the cart after each test to prevent cart data
    // from affecting subsequent tests.
    test.afterEach(async ({ pages }) => {
        await pages.homePage.openHomePage();
        await pages.navBar.navigateToCart();
        await pages.cartPage.clearCart();
        await pages.cartPage.verifyCartIsEmpty();
    });

    // Verify that a guest user can successfully complete the checkout process.
    test('Should be able to checkout as guest', async ({ pages }) => {
        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step(`When the user selects the ${category} category`, async () => {
            await pages.homePage.chooseCategory(category);
        });

        await test.step(`And the user selects the ${product} product`, async () => {
            await pages.homePage.chooseProduct(product);
        });

        await test.step(`Then the ${product} product page should be displayed`, async () => {
            await pages.productPage.checkProductPage(product);
        });

        await test.step(`When the user adds ${product} to the cart`, async () => {
            await pages.productPage.addToCart();
        });

        await test.step('And the user navigates to the cart', async () => {
            await pages.navBar.navigateToCart();
        });

        await test.step(`Then ${product} should be displayed in the cart`, async () => {
            await pages.cartPage.checkCartItem(product);
        });

        const totalAmount = await test.step(
            'And the cart total amount is calculated',
            async () => {
                return await pages.cartPage.getTotalAmount();
            }
        );

        await test.step(
            'When the user places the order',
            async () => {
                await pages.cartPage.placeOrder(
                    checkoutCustomer.name,
                    checkoutCustomer.country,
                    checkoutCustomer.city,
                    checkoutCustomer.card,
                    checkoutCustomer.month,
                    checkoutCustomer.year
                );
            }
        );

        await test.step(
            'Then the purchase confirmation should contain the correct details',
            async () => {
                await pages.cartPage.verifyPurchaseConfirmation(
                    totalAmount,
                    checkoutCustomer
                );
            }
        );
    });

    // Verify that an authenticated user can successfully complete the checkout process.
    test('Should be able to checkout as an authenticated user', async ({ pages }) => {
        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step('And the user logs in with valid credentials', async () => {
            await pages.loginModal.login(
                loginData.validUser.username,
                loginData.validUser.password
            );
        });

        await test.step('Then the logged in username should be displayed', async () => {
            await pages.navBar.verifyNameOfUser(
                loginData.validUser.username
            );
        });

        await test.step(`When the user selects the ${category} category`, async () => {
            await pages.homePage.chooseCategory(category);
        });

        await test.step(`And the user selects the ${product} product`, async () => {
            await pages.homePage.chooseProduct(product);
        });

        await test.step(`Then the ${product} product page should be displayed`, async () => {
            await pages.productPage.checkProductPage(product);
        });

        await test.step(`When the user adds ${product} to the cart`, async () => {
            await pages.productPage.addToCart();
        });

        await test.step('And the user navigates to the cart', async () => {
            await pages.navBar.navigateToCart();
        });

        await test.step(`Then ${product} should be displayed in the cart`, async () => {
            await pages.cartPage.checkCartItem(product);
        });

        const totalAmount = await test.step(
            'And the cart total amount is calculated',
            async () => {
                return await pages.cartPage.getTotalAmount();
            }
        );

        await test.step(
            'When the user places the order',
            async () => {
                await pages.cartPage.placeOrder(
                    checkoutCustomer.name,
                    checkoutCustomer.country,
                    checkoutCustomer.city,
                    checkoutCustomer.card,
                    checkoutCustomer.month,
                    checkoutCustomer.year
                );
            }
        );

        await test.step(
            'Then the purchase confirmation should contain the correct details',
            async () => {
                await pages.cartPage.verifyPurchaseConfirmation(
                    totalAmount,
                    checkoutCustomer
                );
            }
        );
    });

    // Verify that checkout displays a validation message when the name is missing.
    test('Should see a validation when placed order without name', async ({ pages }) => {
        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step(`When the user selects the ${category} category`, async () => {
            await pages.homePage.chooseCategory(category);
        });

        await test.step(`And the user selects the ${product} product`, async () => {
            await pages.homePage.chooseProduct(product);
        });

        await test.step(`Then the ${product} product page should be displayed`, async () => {
            await pages.productPage.checkProductPage(product);
        });

        await test.step(`When the user adds ${product} to the cart`, async () => {
            await pages.productPage.addToCart();
        });

        await test.step('And the user navigates to the cart', async () => {
            await pages.navBar.navigateToCart();
        });

        await test.step(`Then ${product} should be displayed in the cart`, async () => {
            await pages.cartPage.checkCartItem(product);
        });

        const dialogMessage = await test.step(
            'When the user places the order without a name',
            async () => {
                return await pages.cartPage.placeOrder(
                    '',
                    checkoutCustomer.country,
                    checkoutCustomer.city,
                    checkoutCustomer.card,
                    checkoutCustomer.month,
                    checkoutCustomer.year
                );
            }
        );

        await test.step(
            'Then a name and credit card validation should be displayed',
            async () => {
                await pages.cartPage.verifyValidationMessage(
                    dialogMessage,
                    'Please fill out Name and Creditcard.'
                );
            }
        );
    });

    // Verify that checkout displays a validation message when the credit card is missing.
    test('Should see a validation when placed order without card', async ({ pages }) => {
        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step(`When the user selects the ${category} category`, async () => {
            await pages.homePage.chooseCategory(category);
        });

        await test.step(`And the user selects the ${product} product`, async () => {
            await pages.homePage.chooseProduct(product);
        });

        await test.step(`Then the ${product} product page should be displayed`, async () => {
            await pages.productPage.checkProductPage(product);
        });

        await test.step(`When the user adds ${product} to the cart`, async () => {
            await pages.productPage.addToCart();
        });

        await test.step('And the user navigates to the cart', async () => {
            await pages.navBar.navigateToCart();
        });

        await test.step(`Then ${product} should be displayed in the cart`, async () => {
            await pages.cartPage.checkCartItem(product);
        });

        const dialogMessage = await test.step(
            'When the user places the order without a credit card',
            async () => {
                return await pages.cartPage.placeOrder(
                    checkoutCustomer.name,
                    checkoutCustomer.country,
                    checkoutCustomer.city,
                    '',
                    checkoutCustomer.month,
                    checkoutCustomer.year
                );
            }
        );

        await test.step(
            'Then a name and credit card validation should be displayed',
            async () => {
                await pages.cartPage.verifyValidationMessage(
                    dialogMessage,
                    'Please fill out Name and Creditcard.'
                );
            }
        );
    });

    // Known issue: the application currently allows the Place Order action when the cart is empty.
    test('Should not be able to place an order when the cart is empty', async ({ pages }) => {
        test.fail(
            true,
            'Known issue: Place Order should not be available when the cart is empty.'
        );

        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step(
            'When the user navigates to the cart without adding any item',
            async () => {
                await pages.navBar.navigateToCart();
            }
        );

        await test.step('Then the cart should be empty', async () => {
            await pages.cartPage.verifyCartIsEmpty();
        });

        await test.step(
            'And the Place Order button should not be available',
            async () => {
                await pages.cartPage.verifyPlaceOrderIsNotAvailable();
            }
        );
    });

    // Known issue: the application currently accepts an invalid credit card format.
    test('Should not be able to checkout with an invalid card format', async ({ pages }) => {
        test.fail(
            true,
            'Known issue: invalid credit card formats are accepted during checkout.'
        );

        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step(`When the user selects the ${category} category`, async () => {
            await pages.homePage.chooseCategory(category);
        });

        await test.step(`And the user selects the ${product} product`, async () => {
            await pages.homePage.chooseProduct(product);
        });

        await test.step(`Then the ${product} product page should be displayed`, async () => {
            await pages.productPage.checkProductPage(product);
        });

        await test.step(`When the user adds ${product} to the cart`, async () => {
            await pages.productPage.addToCart();
        });

        await test.step('And the user navigates to the cart', async () => {
            await pages.navBar.navigateToCart();
        });

        await test.step(`Then ${product} should be displayed in the cart`, async () => {
            await pages.cartPage.checkCartItem(product);
        });

        const dialogMessage = await test.step(
            'When the user places the order with an invalid card format',
            async () => {
                return await pages.cartPage.placeOrder(
                    checkoutCustomer.name,
                    checkoutCustomer.country,
                    checkoutCustomer.city,
                    'ABC123',
                    checkoutCustomer.month,
                    checkoutCustomer.year
                );
            }
        );

        await test.step(
            'Then a validation message for the invalid card should be displayed',
            async () => {
                await pages.cartPage.verifyValidationMessage(
                    dialogMessage,
                    'Please enter a valid credit card number.'
                );
            }
        );
    });
});