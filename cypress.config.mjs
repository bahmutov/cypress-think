import { defineConfig } from 'cypress'
import { think } from './src/think.mjs'

export default defineConfig({
  defaultBrowser: 'electron',
  e2e: {
    // baseUrl, etc
    baseUrl: 'https://playground.bondaracademy.com/',
    fixturesFolder: false,
    scrollBehavior: 'center',
    defaultCommandTimeout: 1000,
    setupNodeEvents(on, config) {
      on('task', {
        'cypress:think': async ({ prompt, html }) => {
          const result = await think({ prompt, html })
          return result || null
        },
      })
    },
  },
})
