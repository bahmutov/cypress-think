import { defineConfig } from 'cypress'

import cypressThinkPlugin from './src/plugin.mjs'

export default defineConfig({
  defaultBrowser: 'electron',
  e2e: {
    // baseUrl, etc
    baseUrl: 'https://playground.bondaracademy.com/',
    fixturesFolder: false,
    scrollBehavior: 'center',
    defaultCommandTimeout: 1000,
    setupNodeEvents(on, config) {
      const openAiOptions = {
        client: 'openai',
        model: 'gpt-5-codex',
      }
      const ollamaOptions = {
        client: 'ollama',
        model: 'codellama',
      }

      cypressThinkPlugin(on, config, ollamaOptions)
    },
  },
})
