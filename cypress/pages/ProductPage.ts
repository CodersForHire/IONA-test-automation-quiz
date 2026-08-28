class ProductPage {

    stubAlert() {
        cy.on('window:before:load', (win) => {
            cy.stub(win as any, 'alert').as('alert');
        });
    }

    addToCart(productName: string){

        this.stubAlert();
        cy.intercept('/addtocart').as('addToCart');
        cy.get('h2[class="name"]').should('contain', productName);

        cy.contains('.btn', 'Add to cart').click();
        cy.wait('@addToCart').then((intercept) => {
            expect(intercept.response?.statusCode).to.eq(200);
        });
        
    }

    getAlertMessage(){
        return cy.get('@alert');
    }
}

export default new ProductPage();