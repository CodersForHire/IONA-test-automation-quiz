/// <reference types="cypress" />

import { loginPage } from './pages/loginPage'

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Logs in to DemoBlaze using valid credentials.
             */
            login(
                username: string,
                password: string
            ): Chainable<void>

            /**
             * Types into a DemoBlaze input using a controlled delay
             * and verifies the final value.
             */
            typeSlowly(
                selector: string,
                value: string,
                options?: {
                    log?: boolean
                }
            ): Chainable<JQuery>
        }
    }
}

Cypress.Commands.add(
    'typeSlowly',
    (
        selector: string,
        value: string,
        options: { log?: boolean } = {}
    ) => {
        cy.get(selector)
            .should('be.visible')
            .and('not.be.disabled')
            .clear()
            .should('have.value', '')

        for (const character of value) {
            cy.get(selector)
                .should('be.visible')
                .type(character, {
                    delay: 50,
                    log: options.log ?? true
                })
        }

        return cy.get(selector)
            .should('have.value', value)
    }
)

Cypress.Commands.add(
    'login',
    (username: string, password: string) => {
        loginPage.login(username, password)
    }
)

export {}