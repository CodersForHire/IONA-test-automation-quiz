import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,

  reporter: 'cypress-mochawesome-reporter',

  reporterOptions: {
    charts: true,
    reportPageTitle: 'DemoBlaze Test Automation Report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false
  },

  e2e: {
    baseUrl: 'https://www.demoblaze.com',

    video: false,
    screenshotOnRunFailure: true,

    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    watchForFileChanges: false,

    setupNodeEvents(on) {
      require('cypress-mochawesome-reporter/plugin')(on)
    },

    specPattern: 'cypress/e2e/**/*.cy.ts'
  }
})