import { defineConfig } from 'cypress'
import { think } from './src/think.mjs'
import { readAgentInstructions } from './src/agent-instructions.mjs'
import fastify from 'fastify'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

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

const CACHE_FILE_PATH = join(process.cwd(), 'thoughts.json')

// Load promptCache from file if it exists
let promptCache = {}
async function loadPromptCache() {
  if (existsSync(CACHE_FILE_PATH)) {
    try {
      const content = await readFile(CACHE_FILE_PATH, 'utf-8')
      promptCache = JSON.parse(content)
      console.log('Loaded prompt cache from thoughts.json')
    } catch (error) {
      console.warn('Failed to load prompt cache:', error.message)
    }
  }
}

// Save promptCache to file
async function savePromptCache() {
  try {
    await writeFile(
      CACHE_FILE_PATH,
      JSON.stringify(promptCache, null, 2),
      'utf-8',
    )
  } catch (error) {
    console.error('Failed to save prompt cache:', error.message)
  }
}

// Read agent instructions once at startup
let agentInstructions = null
;(async () => {
  await loadPromptCache()
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
  console.log(
    'saving generated code in file %s test "%s"',
    specFilename,
    testTitle,
  )
  // Implementation: modify the spec file by commenting out the original
  // .think(...) call that contains the given prompt, then insert generated code.
  try {
    if (!specFilename || !prompt || !generatedCode) {
      console.warn('Missing required fields to process spec file')
    } else {
      // Use sync fs ops as allowed for simplicity
      const fs = await import('node:fs')
      const path = await import('node:path')
      const absoluteSpecPath = path.resolve(
        process.cwd(),
        specFilename,
      )
      if (!fs.existsSync(absoluteSpecPath)) {
        console.warn('Spec file does not exist:', absoluteSpecPath)
      } else {
        const originalSource = fs.readFileSync(
          absoluteSpecPath,
          'utf8',
        )

        // Avoid re-processing if we already added generated code for this prompt
        const alreadyGeneratedMarker = `// cy.think generated code for test: ${testTitle}`
        if (originalSource.includes(alreadyGeneratedMarker)) {
          console.log(
            'Spec file already contains generated code marker, skipping update',
          )
        } else {
          // Build regex to locate the .think(...) invocation containing the prompt.
          // We support backticks and single quotes.
          // Capture from ".think(" up to the closing parenthesis and semicolon/newline.
          const escapedPrompt = prompt.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
          ) // escape for regex
          const thinkPatterns = [
            new RegExp(
              '\\.think\\(\\s*`' + escapedPrompt + '`\\s*\\)',
              's',
            ),
            new RegExp(
              `\\.think\\(\\s*'${escapedPrompt}'\\s*\\)`,
              's',
            ),
            new RegExp(
              `\\.think\\(\\s*\"${escapedPrompt}\"\\s*\\)`,
              's',
            ),
          ]
          let matchInfo = null
          for (const re of thinkPatterns) {
            const m = originalSource.match(re)
            if (m) {
              matchInfo = { match: m[0], index: m.index }
              break
            }
          }

          if (!matchInfo) {
            console.warn(
              'Could not find .think(...) call with provided prompt in spec file',
            )
          } else {
            const { match, index } = matchInfo
            // Determine the full range to comment out. We will comment line by line.
            // Extend to end of line after the match for clarity.
            const endIndex = index + match.length
            // Split source into lines to apply comments precisely
            const before = originalSource.slice(0, index)
            const after = originalSource.slice(endIndex)
            // Delete the original .think(...) call entirely instead of commenting it out
            // Avoid adding a leading blank line before the generated code block
            const insertionBlock = `${alreadyGeneratedMarker}\n${generatedCode}\n// end cy.think generated code`
            const newSource = before + insertionBlock + after

            fs.writeFileSync(absoluteSpecPath, newSource, 'utf8')
            console.log(
              'Updated spec file with generated code:',
              absoluteSpecPath,
            )
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to update spec file with generated code', e)
  }

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
          promptCache[promptHash] = {
            ...result,
            specFilename,
            testTitle,
          }
          await savePromptCache()
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
