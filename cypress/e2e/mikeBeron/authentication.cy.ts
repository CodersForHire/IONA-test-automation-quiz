import { homePage } from '../../support/pages/homePage'
import { loginPage } from '../../support/pages/loginPage'

describe('DemoBlaze - Authentication', () => {

    beforeEach(() => {
        homePage.open()
    })

    it(
        'TC-09 - should log in with valid credentials',
        { tags: ['@positive', '@authentication', '@regression'] },
        () => {
            cy.env(['username', 'password'], { log: false })
                .then(({ username, password }) => {
                    expect(Boolean(username), 'username is configured')
                        .to.be.true

                    expect(Boolean(password), 'password is configured')
                        .to.be.true

                    cy.login(username, password)
                })
        }
    )

    it(
        'TC-04 - should reject login with an incorrect password',
        { tags: ['@negative', '@authentication'] },
        () => {
            const invalidPassword = 'pw_invalid'

            cy.env(['username'], { log: false })
                .then(({ username }) => {
                    expect(Boolean(username), 'username is configured')
                        .to.be.true

                    loginPage.open()
                    loginPage.enterUsername(username)
                    loginPage.enterPassword(invalidPassword)

                    const alertSpy = cy.spy().as('loginAlert')

                    cy.on('window:alert', alertSpy)

                    loginPage.submit()

                    cy.get('@loginAlert')
                        .should(
                            'have.been.calledOnceWith',
                            'Wrong password.'
                        )

                    loginPage.verifyUserIsNotLoggedIn()
                })
        }
    )

    it(
        'TC-08 - should reject login when username and password are empty',
        { tags: ['@negative', '@authentication'] },
        () => {
            loginPage.open()

            loginPage.verifyUsernameIsEmpty()
            loginPage.verifyPasswordIsEmpty()

            cy.window().then((win) => {
                cy.stub(win, 'alert' as keyof typeof win)
                    .as('loginAlert')
            })

            loginPage.submit()

            cy.get('@loginAlert')
                .should(
                    'have.been.calledOnceWith',
                    'Please fill out Username and Password.'
                )

            loginPage.verifyUserIsNotLoggedIn()
        }
    )
})