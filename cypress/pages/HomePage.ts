import { Product } from '../types/Product'

class HomePage {

    visit(){
        cy.visit('/index.html');
    }

    selectProduct(product: Product){
        
        cy.get('#contcont')
            .contains('a', product.category)
            .click(); 
            
        cy.contains('a', product.name)
            .invoke('attr', 'href')
            .then((href) => {
                cy.visit(href!);
            });
    }
}

export default new HomePage();