import { defineConfig } from 'cypress'

import cypressThinkPlugin from './src/plugin.mjs'

export default defineConfig({
  defaultBrowser: 'electron',
  e2e: {
    // baseUrl, etc
    experimentalPromptCommand: true,
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
        model: 'deepseek-r1', // 'codellama',
      }
      const aiOptions = {
        temperature: 0.1,
      }

      cypressThinkPlugin(on, config, ollamaOptions, aiOptions)
    },
  },
})
