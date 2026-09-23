export class LoginPage {

    private get loginMenuLink() {
        return cy.get('#login2')
    }

    private get loginModal() {
        return cy.get('#logInModal')
    }

    private get usernameInput() {
        return cy.get('#loginusername')
    }

    private get passwordInput() {
        return cy.get('#loginpassword')
    }

    private get loginButton() {
        return cy.contains('#logInModal button', 'Log in')
    }

    private get loggedInUser() {
        return cy.get('#nameofuser')
    }

    open() {
        this.loginMenuLink
            .should('be.visible')
            .click()

        this.loginModal
            .should('be.visible')
    }

    enterUsername(username: string) {
        cy.typeSlowly('#loginusername', username)
    }

    enterPassword(password: string) {
        cy.typeSlowly('#loginpassword', password, {
            log: false
        })
    }

    verifyUsernameIsEmpty() {
        this.usernameInput
            .should('be.visible')
            .and('have.value', '')
    }

    verifyPasswordIsEmpty() {
        this.passwordInput
            .should('be.visible')
            .and('have.value', '')
    }

    submit() {
        this.loginButton
            .should('be.visible')
            .and('be.enabled')
            .click()
    }

    verifyLoggedIn(username: string) {
        this.loggedInUser
            .should('be.visible')
            .and('contain.text', `Welcome ${username}`)
    }

    verifyUserIsNotLoggedIn() {
        this.loggedInUser
            .should('not.be.visible')
    }

    login(username: string, password: string) {
        this.open()
        this.enterUsername(username)
        this.enterPassword(password)
        this.submit()
        this.verifyLoggedIn(username)
    }
}

export const loginPage = new LoginPage()