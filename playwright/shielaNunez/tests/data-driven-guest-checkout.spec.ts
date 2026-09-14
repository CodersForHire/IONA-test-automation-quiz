import { test } from '../fixtures/pageFixtures';
import {
    checkoutCustomer,
    checkoutDataScenarios
} from '../test-data/checkoutData';

test.describe('Guest Checkout', () => {
    // Clean up the cart after each test to prevent cart data
    // from affecting subsequent tests.
    test.afterEach(async ({ pages }) => {
        await pages.homePage.openHomePage();
        await pages.navBar.navigateToCart();
        await pages.cartPage.clearCart();
        await pages.cartPage.verifyCartIsEmpty();
    });

    // Individual Product Checkout
    // Verify that a guest user can successfully checkout
    // with each product defined in the test data.
    for (const data of checkoutDataScenarios) {
        test(
            `Should be able to checkout as guest - ${data.product}`,
            async ({ pages }) => {
                const { category, product } = data;

                await test.step(
                    'Given the user is on the home page',
                    async () => {
                        await pages.homePage.openHomePage();
                    }
                );

                await test.step(
                    `When the user selects the ${category} category`,
                    async () => {
                        await pages.homePage.chooseCategory(category);
                    }
                );

                await test.step(
                    `And the user selects the ${product} product`,
                    async () => {
                        await pages.homePage.chooseProduct(product);
                    }
                );

                await test.step(
                    `Then the ${product} product page should be displayed`,
                    async () => {
                        await pages.productPage.checkProductPage(product);
                    }
                );

                await test.step(
                    `When the user adds ${product} to the cart`,
                    async () => {
                        await pages.productPage.addToCart();
                    }
                );

                await test.step(
                    'And the user navigates to the cart',
                    async () => {
                        await pages.navBar.navigateToCart();
                    }
                );

                await test.step(
                    `Then ${product} should be displayed in the cart`,
                    async () => {
                        await pages.cartPage.checkCartItem(product);
                    }
                );

                // Calculate the cart total before placing the order
                // so it can be verified against the purchase confirmation.
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
            }
        );
    }


    // All Products Checkout
    // Verify that a guest user can add all products to the same cart
    // and successfully complete a single checkout.
    test(
        'Should be able to checkout with all products',
        async ({ pages }) => {
            await test.step(
                'Given the user is on the home page',
                async () => {
                    await pages.homePage.openHomePage();
                }
            );

            await test.step(
                'When the user adds all products to the cart',
                async () => {
                    for (const data of checkoutDataScenarios) {
                        await pages.homePage.chooseCategory(
                            data.category
                        );

                        await pages.homePage.chooseProduct(
                            data.product
                        );

                        await pages.productPage.checkProductPage(
                            data.product
                        );

                        await pages.productPage.addToCart();

                        // Return to the home page before selecting
                        // the next product.
                        await pages.homePage.openHomePage();
                    }
                }
            );

            await test.step(
                'And the user navigates to the cart',
                async () => {
                    await pages.navBar.navigateToCart();
                }
            );

            await test.step(
                'Then all products should be displayed in the cart',
                async () => {
                    // Extract the product names from the test data
                    // and let the Page Object verify each item.
                    const products = checkoutDataScenarios.map(
                        data => data.product
                    );

                    await pages.cartPage.checkCartItems(products);
                }
            );

            // Calculate the total of all products in the cart
            // before placing the order.
            const totalAmount = await test.step(
                'And the cart total amount is calculated',
                async () => {
                    return await pages.cartPage.getTotalAmount();
                }
            );

            // Place one order containing all products.
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
        }
    );
});