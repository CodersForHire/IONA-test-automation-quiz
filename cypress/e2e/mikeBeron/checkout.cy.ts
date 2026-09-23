import customerData from '../../fixtures/customer.json'
import productData from '../../fixtures/products.json'
import { addProductToCart } from '../../support/helpers/cart'
import { homePage } from '../../support/pages/homePage'
import { cartPage } from '../../support/pages/cartPage'
import type { Customer } from '../../support/pages/cartPage'

const customer: Customer = customerData.validCustomer
const productName = productData.samsungGalaxyS6.name
const productPrice = productData.samsungGalaxyS6.price

describe('DemoBlaze - Checkout', () => {

    beforeEach(() => {
        homePage.open()
    })

    it(
        'TC-01 - should display the homepage',
        { tags: ['@smoke', '@regression'] },
        () => {
            homePage.verifyStoreIsDisplayed()
        }
    )

    it(
        'TC-02 - should complete checkout as an authenticated user',
        {
            tags: [
                '@smoke',
                '@positive',
                '@checkout',
                '@authentication'
            ]
        },
        () => {
            cy.env(['username', 'password'], { log: false })
                .then(({ username, password }) => {
                    expect(
                        Boolean(username),
                        'username is configured'
                    ).to.be.true

                    expect(
                        Boolean(password),
                        'password is configured'
                    ).to.be.true

                    cy.login(username, password)

                    // DemoBlaze persists cart state for authenticated users.
                    // Establish a known empty-cart state before checkout.
                    cartPage.clearCart()

                    homePage.open()

                    addProductToCart(productName)

                    cartPage.open()
                    cartPage.verifyProductIsDisplayed(productName)
                    cartPage.openCheckout()

                    cartPage.fillCheckoutForm(customer)
                    cartPage.clickPurchase()

                    cartPage.verifyPurchaseConfirmation(productPrice)
                })
        }
    )

    it(
        'TC-03 - should complete checkout as a guest',
        { tags: ['@smoke', '@positive', '@checkout'] },
        () => {
            addProductToCart(productName)

            cartPage.open()
            cartPage.verifyProductIsDisplayed(productName)
            cartPage.openCheckout()

            cartPage.fillCheckoutForm(customer)
            cartPage.clickPurchase()

            cartPage.verifyPurchaseConfirmation(productPrice)
        }
    )

    it(
        'TC-05 - should prevent checkout when required fields are empty',
        { tags: ['@negative', '@checkout'] },
        () => {
            addProductToCart(productName)

            cartPage.open()
            cartPage.verifyProductIsDisplayed(productName)
            cartPage.openCheckout()

            cartPage.verifyNameIsEmpty()
            cartPage.verifyCardIsEmpty()

            cy.window().then((win) => {
                cy.stub(win, 'alert' as keyof typeof win)
                    .as('checkoutAlert')
            })

            cartPage.clickPurchase()

            cy.get('@checkoutAlert')
                .should(
                    'have.been.calledOnceWith',
                    'Please fill out Name and Creditcard.'
                )

            cartPage.verifyCheckoutIsDisplayed()

            cartPage.closeCheckout()
            cartPage.removeProduct(productName)
        }
    )

    it(
        'TC-06 - should prevent checkout when credit card is empty',
        { tags: ['@negative', '@checkout'] },
        () => {
            addProductToCart(productName)

            cartPage.open()
            cartPage.verifyProductIsDisplayed(productName)
            cartPage.openCheckout()

            cartPage.enterName(customer.name)
            cartPage.verifyCardIsEmpty()

            cy.window().then((win) => {
                cy.stub(win, 'alert' as keyof typeof win)
                    .as('checkoutAlert')
            })

            cartPage.clickPurchase()

            cy.get('@checkoutAlert')
                .should(
                    'have.been.calledOnceWith',
                    'Please fill out Name and Creditcard.'
                )

            cartPage.verifyCheckoutIsDisplayed()

            cartPage.closeCheckout()
            cartPage.removeProduct(productName)
        }
    )

    it(
        'TC-07 - should prevent checkout when customer name is empty',
        { tags: ['@negative', '@checkout'] },
        () => {
            addProductToCart(productName)

            cartPage.open()
            cartPage.verifyProductIsDisplayed(productName)
            cartPage.openCheckout()

            cartPage.verifyNameIsEmpty()
            cartPage.enterCard(customer.card)

            cy.window().then((win) => {
                cy.stub(win, 'alert' as keyof typeof win)
                    .as('checkoutAlert')
            })

            cartPage.clickPurchase()

            cy.get('@checkoutAlert')
                .should(
                    'have.been.calledOnceWith',
                    'Please fill out Name and Creditcard.'
                )

            cartPage.verifyCheckoutIsDisplayed()

            cartPage.closeCheckout()
            cartPage.removeProduct(productName)
        }
    )
})