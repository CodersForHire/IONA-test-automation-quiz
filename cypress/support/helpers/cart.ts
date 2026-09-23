import { homePage } from '../pages/homePage'
import { productPage } from '../pages/productPage'

export const addProductToCart = (productName: string) => {
    cy.intercept('POST', '**/addtocart').as('addToCart')

    homePage.selectProduct(productName)

    cy.once('window:alert', (message) => {
        expect(message.trim()).to.match(/^Product added\.?$/)
    })

    productPage.addToCart()

    cy.wait('@addToCart')
        .its('response.statusCode')
        .should('eq', 200)
}