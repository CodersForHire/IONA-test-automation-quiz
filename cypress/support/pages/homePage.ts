export class HomePage {

    private get storeLogo() {
        return cy.get('#nava')
    }

    open() {
        cy.visit('/')
    }

    verifyStoreIsDisplayed() {
        this.storeLogo
            .should('be.visible')
            .and('contain.text', 'PRODUCT STORE')
    }

    selectProduct(productName: string) {
        cy.contains('.hrefch', productName)
            .should('be.visible')
            .click()
    }
}

export const homePage = new HomePage()