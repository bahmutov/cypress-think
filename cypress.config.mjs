import { defineConfig } from 'cypress'
import { think } from './src/think.mjs'
import { readAgentInstructions } from './src/agent-instructions.mjs'
import fastify from 'fastify'

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

// Read agent instructions once at startup
let agentInstructions = null
;(async () => {
  agentInstructions = await readAgentInstructions()
})()

// prepare a server to receive "save prompt" requests from the browser
const server = fastify({ logger: false })
server.options('/save-generated-thought', (req, res) => {
  res
    .headers({
      Allow: 'OPTIONS, POST',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
    })
    .status(200)
    .send()
})
server.post('/save-generated-thought', async (req, res) => {
  const { specFilename, testTitle, prompt, generatedCode } = req.body

  // Save the generated code to a file or database
  // ...
  console.log('TODO: save generated code for prompt:', {
    specFilename,
    testTitle,
  })

  res
    .headers({
      'access-control-allow-origin': '*',
      'access-control-request-headers': 'Content-Type',
    })
    .status(200)
    .send({ success: true })
})
server.listen({ port: 4321 }).then(() => {
  console.log('cy.think server listening on port 4321')
})

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
              command: promptCache[promptHash].command,
              totalTokens: promptCache[promptHash].totalTokens,
              fromCache: true,
            }
          }
          const result = await think({
            prompt,
            html,
            agentInstructions,
          })
          promptCache[promptHash] = result
          return {
            command: result.command,
            totalTokens: result.totalTokens,
            fromCache: false,
          }
        },
      })
    },
  },
})
