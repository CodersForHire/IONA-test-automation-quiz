import productData from '../../fixtures/products.json'
import { addProductToCart } from '../../support/helpers/cart'
import { homePage } from '../../support/pages/homePage'
import { productPage } from '../../support/pages/productPage'
import { cartPage } from '../../support/pages/cartPage'

describe('DemoBlaze - Regression', () => {

    const productName = productData.samsungGalaxyS6.name
    const productPrice = productData.samsungGalaxyS6.price

    beforeEach(() => {
        homePage.open()
    })

    it(
        'TC-10 - should display the correct product details',
        { tags: ['@regression'] },
        () => {
            homePage.selectProduct(productName)

            productPage.verifyProductDetails(
                productName,
                productPrice
            )
        }
    )

    it(
        'TC-11 - should add a product to the cart and display the correct total',
        { tags: ['@regression', '@cart'] },
        () => {
            addProductToCart(productName)

            cartPage.open()
            cartPage.verifyProductIsDisplayed(productName)
            cartPage.verifyTotal(productPrice)
        }
    )

    it(
        'TC-12 - should remove a product from the cart',
        { tags: ['@regression', '@cart'] },
        () => {
            addProductToCart(productName)

            cartPage.open()
            cartPage.verifyProductIsDisplayed(productName)

            cartPage.removeProduct(productName)
        }
    )
})