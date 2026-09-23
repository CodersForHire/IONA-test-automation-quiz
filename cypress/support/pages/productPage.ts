export class ProductPage {

    private get productName() {
        return cy.get('.name')
    }

    private get productPrice() {
        return cy.get('.price-container')
    }

    private get addToCartLink() {
        return cy.contains('a', 'Add to cart')
    }

    verifyProductDetails(name: string, price: number) {
        this.productName
            .should('be.visible')
            .and('have.text', name)

        this.productPrice
            .should('be.visible')
            .and('contain.text', `$${price}`)
    }

    addToCart() {
        this.addToCartLink
            .should('be.visible')
            .click()
    }
}

export const productPage = new ProductPage()