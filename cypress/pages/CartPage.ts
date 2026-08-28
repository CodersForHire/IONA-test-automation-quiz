import { Customer } from '../types/Customer'
import { OrderDetails } from '../types/OrderDetails'

class CartPage{
    elements = {
        paymentDetails: () => cy.get('p.lead.text-muted')
    }

    visit(){
        cy.visit('/cart.html');
    }

    getProductRow(productName: string){
        return cy.contains('#tbodyid tr', productName);
    }

    removeProduct(productName: string){
        cy.intercept('/deleteitem').as('deleteItem');
        cy.contains('#tbodyid tr', productName)
            .find('a')
            .contains('Delete')
            .click();
        cy.wait('@deleteItem')
            .its('response.statusCode')
            .should('eq', 200);
    }

    placeOrder(productName: string, customerDetails: Customer){
        cy.url().should('contain', '/cart');
        cy.contains('button', 'Place Order')
            .should('be.visible')
            .click();
        cy.get('#orderModalLabel')
            .should('be.visible');

        for (const [key, value] of Object.entries(customerDetails)) {
            cy.log(key, value);
            if(value.length > 0){
                cy.get('input[id="'+key+'"]')
                    .clear()
                    .click()
                    .type(value, {delay:50});
            }else{
                cy.get('input[id="'+key+'"]').click();
            }
        }
    }

    clickPurchase(){
        cy.get('#orderModal').contains('button', 'Purchase')
            .click();
    }

    clickClose(){
        cy.get('#orderModal').contains('button','Close')
            .click();
    }

    getPlaceOrderModal(){
        return cy.get('#orderModalLabel');
    }

    getOrderDetails(): Cypress.Chainable<OrderDetails> {
        return cy.contains('.sweet-alert', 'Thank you for your purchase!')
            .invoke('text')
            .then((text): OrderDetails => {
                const orderDetails: OrderDetails = {
                    id: text.match(/Id:\s*(\d+)/)?.[1] ?? '',
                    amount: text.match(/Amount:\s*(.*?)\s*Card Number:/)?.[1] ?? '',
                    cardNumber: text.match(/Card Number:\s*(.*?)\s*Name:/)?.[1] ?? '',
                    name: text.match(/Name:\s*(.*?)\s*Date:/)?.[1] ?? '',
                    date: text.match(/Date:\s*(.*)/)?.[1] ?? ''
                };

                return orderDetails;
            }) as unknown as Cypress.Chainable<OrderDetails>;
    }

    getErrorMessage(){
        return cy.get('@alert');
    }

}

export default new CartPage(); 