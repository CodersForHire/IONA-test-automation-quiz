class LoginPage{
    userNameField = '#loginusername';
    passwordField = '#loginpassword'; 

    stubAlert(){
        cy.on('window:before:load', (win) => {
            cy.stub(win as any, 'alert').as('alert');
        });
    }

    visit(){
        this.stubAlert();
        cy.visit('/index.html');
        cy.get('#login2').click(); 
    }

    setUsername(username: string){
        cy.get('[for="log-name"]').should('contain', 'Username:');
        cy.get(this.userNameField).should('be.visible');
        cy.get(this.userNameField).click();
        cy.get(this.userNameField)
            .click()
            .clear()
            .type(username, {delay: 100})
            .should('have.value', username);
    }

    setPassword(password: string){
        cy.get('[for="log-pass"]').should('contain', 'Password:');
        cy.get(this.passwordField).should('be.visible');
        cy.get(this.passwordField).click();
        cy.get(this.passwordField)
            .click()
            .clear()
            .type(password, {delay: 100})
            .should('have.value', password);
    }

    clickLoginButton(){
        cy.contains('button', 'Log in').click();
    }

    getAlertMessage(){
        return cy.get('@alert');
    }

    login(username:string, password:string){
        this.visit();
        this.setUsername(username);
        this.setPassword(password);
        
        cy.intercept('/entries').as('getEntries');

        this.clickLoginButton(); 
        cy.wait('@getEntries')
            .its('response.statusCode')
            .should('eq', 200); 
    }
};


export default new LoginPage();