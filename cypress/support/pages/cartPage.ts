export type Customer = {
    name: string
    country: string
    city: string
    card: string
    month: string
    year: string
}

export class CartPage {

    private get cartLink() {
        return cy.get('#cartur')
    }

    private get total() {
        return cy.get('#totalp')
    }

    private get checkoutModal() {
        return cy.get('#orderModal')
    }

    private get nameInput() {
        return cy.get('#name')
    }

    private get cardInput() {
        return cy.get('#card')
    }

    open() {
        this.cartLink
            .should('be.visible')
            .click()
    }

    getProduct(productName: string) {
        return cy.contains('#tbodyid td', productName)
    }

    verifyProductIsDisplayed(productName: string) {
        this.getProduct(productName)
            .should('be.visible')
    }

    verifyProductIsRemoved(productName: string) {
        this.getProduct(productName)
            .should('not.exist')
    }

    verifyTotal(expectedPrice: number) {
        this.total
            .should('be.visible')
            .and('have.text', expectedPrice.toString())
    }

    removeProduct(productName: string) {
        cy.intercept('POST', '**/deleteitem').as('deleteCartItem')

        cy.contains('#tbodyid tr', productName)
            .within(() => {
                cy.contains('a', 'Delete')
                    .should('be.visible')
                    .click()
            })

        cy.wait('@deleteCartItem')
            .its('response.statusCode')
            .should('eq', 200)

        this.verifyProductIsRemoved(productName)
    }

    clearCart() {
        cy.intercept('POST', '**/viewcart').as('loadCart')
        cy.intercept('POST', '**/deleteitem').as('deleteCartItem')

        this.open()

        cy.wait('@loadCart').then((interception) => {
            expect(interception.response?.statusCode)
                .to.eq(200)

            const items = interception.response?.body?.Items ?? []

            cy.log(`Cart contains ${items.length} item(s)`)

            if (items.length === 0) {
                cy.log('Cart is already empty')
                return
            }

            const deleteNextProduct = (): void => {

                // Wait specifically for the cart item's Delete link.
                cy.contains(
                    '#tbodyid a',
                    'Delete',
                    { timeout: 5000 }
                )
                    .should('be.visible')
                    .click()

                cy.wait('@deleteCartItem')
                    .its('response.statusCode')
                    .should('eq', 200)

                cy.wait('@loadCart').then((refresh) => {
                    expect(refresh.response?.statusCode)
                        .to.eq(200)

                    const remainingItems =
                        refresh.response?.body?.Items ?? []

                    cy.log(
                        `Remaining cart items: ${remainingItems.length}`
                    )

                    if (remainingItems.length === 0) {
                        cy.get('#tbodyid tr')
                            .should('have.length', 0)

                        cy.log('Cart cleanup completed')
                        return
                    }

                    deleteNextProduct()
                })
            }

            deleteNextProduct()
        })
    }

    openCheckout() {
        cy.contains('button', 'Place Order')
            .should('be.visible')
            .and('be.enabled')
            .click()

        this.checkoutModal
            .should('be.visible')
    }

    closeCheckout() {
        cy.contains('#orderModal button', 'Close')
            .should('be.visible')
            .click()

        this.checkoutModal
            .should('not.be.visible')
    }

    fillCheckoutForm(customer: Customer) {
        cy.typeSlowly('#name', customer.name)
        cy.typeSlowly('#country', customer.country)
        cy.typeSlowly('#city', customer.city)
        cy.typeSlowly('#card', customer.card)
        cy.typeSlowly('#month', customer.month)
        cy.typeSlowly('#year', customer.year)
    }

    enterName(name: string) {
        cy.typeSlowly('#name', name)
    }

    enterCard(card: string) {
        cy.typeSlowly('#card', card)
    }

    verifyNameIsEmpty() {
        this.nameInput
            .should('have.value', '')
    }

    verifyCardIsEmpty() {
        this.cardInput
            .should('have.value', '')
    }

    clickPurchase() {
        cy.contains('#orderModal button', 'Purchase')
            .scrollIntoView()
            .should('be.visible')
            .and('be.enabled')
            .click()
    }

    verifyCheckoutIsDisplayed() {
        this.checkoutModal
            .should('be.visible')
    }

    verifyPurchaseConfirmation(expectedAmount: number) {
        cy.get('.sweet-alert')
            .should('be.visible')
            .within(() => {
                cy.get('h2')
                    .should('have.text', 'Thank you for your purchase!')

                cy.get('p')
                    .invoke('text')
                    .then((details) => {
                        const amountMatch = details.match(/Amount:\s*(\d+)/)

                        expect(
                            amountMatch,
                            'purchase amount is present in confirmation'
                        ).to.not.be.null

                        if (!amountMatch) {
                            throw new Error(
                                `Purchase amount was not found in confirmation: ${details}`
                            )
                        }

                        const actualAmount = Number(amountMatch[1])

                        expect(
                            actualAmount,
                            'purchase confirmation amount'
                        ).to.eq(expectedAmount)
                    })
            })
    }
}

export const cartPage = new CartPage()