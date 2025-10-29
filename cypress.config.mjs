import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // baseUrl, etc
    baseUrl: 'https://playground.bondaracademy.com/',
    fixturesFolder: false,
    scrollBehavior: 'center',
    defaultCommandTimeout: 1000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // and load any plugins that require the Node environment
    },
  },
})
