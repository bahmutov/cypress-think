import { defineConfig } from 'cypress'
import { think } from './src/think.mjs'

async function hashString(str, algorithm = 'SHA-256') {
  // algorithm can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
  const encoder = new TextEncoder() // UTF-8 encode
  const data = encoder.encode(str) // Uint8Array
  const hashBuffer = await crypto.subtle.digest(algorithm, data) // ArrayBuffer
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex
}

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
        'cypress:think': async (options) => {
          const { prompt, html, specFilename, testTitle } = options

          const promptHash = await hashString(
            specFilename + testTitle + prompt,
          )
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
