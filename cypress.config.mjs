import { defineConfig } from 'cypress'
import { think } from './src/think.mjs'

const promptCache = {}

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
        'cypress:think': async ({ prompt, promptHash, html }) => {
          if (!promptHash) {
            throw new Error('Prompt hash is required for caching')
          }

          if (promptHash in promptCache) {
            console.log('Using cached command for prompt:', prompt)
            return {
              command: promptCache[promptHash],
              fromCache: true,
            }
          }
          const result = await think({ prompt, html })
          promptCache[promptHash] = result
          return { command: result, fromCache: false }
        },
      })
    },
  },
})
