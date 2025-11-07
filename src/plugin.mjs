// @ts-check

import { think as thinkOpenAi } from './clients/openai.mjs'
import { think as thinkOllama } from './clients/ollama.mjs'
import { readAgentInstructions } from './agent-instructions.mjs'
import fastify from 'fastify'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import debug from 'debug'

const log = debug('cypress-think')
const logHtml = debug('cypress-think:html')

/**
 * Remove all <style> elements from HTML string
 * @param {string} html - The HTML string to process
 * @returns {string} HTML string without style elements
 */
function removeStyleElements(html) {
  if (!html) {
    return html
  }
  // Remove all <style>...</style> tags (including multi-line)
  // This regex handles:
  // - <style> with or without attributes
  // - Content spanning multiple lines
  // - Multiple style elements
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
}

/**
 * Remove all <script> elements from HTML string
 * @param {string} html - The HTML string to process
 * @returns {string} HTML string without script elements
 */
function removeScriptElements(html) {
  if (!html) {
    return html
  }
  // Remove all <script>...</script> tags (including multi-line)
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
}

/**
 * @param {string} str
 * @param {string} [algorithm]
 * @returns {Promise<string>} hex string of the hash
 */
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

/**
 * We do not save the generated command right away,
 * we first send it to the browser, and only if it
 * succeeds, we save it to the cache.
 * This object holds prompts waiting to be cached.
 */
const waitingToCachePrompts = {}

async function loadPromptCache() {
  if (existsSync(CACHE_FILE_PATH)) {
    try {
      const content = await readFile(CACHE_FILE_PATH, 'utf-8')
      promptCache = JSON.parse(content)
      console.log('Loaded prompt cache from thoughts.json')
    } catch (error) {
      console.warn('Failed to load prompt cache:', error.message)
    }
  } else {
    log('Did not find existing thoughts.json cache file')
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
          new RegExp(`\\.think\\(\\s*'${escapedPrompt}'\\s*\\)`, 's'),
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
server.options('/clear-cached-thoughts', (req, res) => {
  res
    .headers({
      Allow: 'OPTIONS, POST',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
    })
    .status(200)
    .send()
})
server.post('/clear-cached-thoughts', async (req, res) => {
  const { specFilename, testTitle } = req.body

  // Clear cached thoughts for the given spec and test title
  console.log(
    'Clearing cached thoughts for spec "%s" test "%s"',
    specFilename,
    testTitle,
  )

  let deletedCount = 0
  Object.entries(promptCache).forEach(([hash, entry]) => {
    if (
      entry.specFilename === specFilename &&
      entry.testTitle === testTitle
    ) {
      delete promptCache[hash]
      console.log('Deleted cached thought with hash:', hash)
      deletedCount += 1
    }
  })
  // delete any potential waiting to cache prompts as well
  Object.entries(waitingToCachePrompts).forEach(([hash, entry]) => {
    if (
      entry.specFilename === specFilename &&
      entry.testTitle === testTitle
    ) {
      delete waitingToCachePrompts[hash]
    }
  })

  if (deletedCount) {
    await savePromptCache()
  }
  console.log('Total deleted cached thoughts:', deletedCount)

  res
    .headers({
      'access-control-allow-origin': '*',
      'access-control-request-headers': 'Content-Type',
    })
    .status(200)
    .send({ success: true })
})

server.post('/save-prompt', async (req, res) => {
  const { promptHash } = req.body

  console.log('Saving successful prompt hash "%s"', promptHash)
  if (promptHash in waitingToCachePrompts) {
    const entry = waitingToCachePrompts[promptHash]
    promptCache[promptHash] = entry
    delete waitingToCachePrompts[promptHash]
    await savePromptCache()
  } else {
    console.warn(
      'No prompt found waiting to be cached for hash:',
      promptHash,
    )
  }

  res.status(200).send({ success: true })
})

server.listen({ port: 4321 }).then(() => {
  console.log('cy.think server listening on port 4321')
})

export default function cypressThinkPlugin(
  on,
  config,
  options = {},
  aiOptions = {},
) {
  const client = options.client || 'openai' // or 'ollama'

  let think = null
  let model = options.model || null
  if (client === 'openai') {
    think = thinkOpenAi
    model = model || 'gpt-4.1'
  } else if (client === 'ollama') {
    think = thinkOllama
    model = model || 'codellama'
  } else {
    throw new Error('Unsupported client: ' + client)
  }

  on('task', {
    'cypress:think': async (thinkOptions) => {
      const { prompt, specFilename, testTitle } = thinkOptions
      let { html } = thinkOptions

      log('Received think task for prompt: %s', prompt)
      log(
        'Start of HTML if any: %s',
        html ? html.slice(0, 100) : 'no html',
      )
      logHtml(html)

      // Remove all <style>, <script> elements before processing
      html = removeStyleElements(html)
      html = removeScriptElements(html)
      log('Removed style and script elements from HTML')

      const MAX_HTML_LENGTH = 10_000
      if (html.length > MAX_HTML_LENGTH) {
        log(
          'HTML length is %d characters, truncating to %d',
          html.length,
          MAX_HTML_LENGTH,
        )
        html = html.slice(0, MAX_HTML_LENGTH)
        logHtml('Truncated HTML:\n%s', html)
      }

      const promptHash = await hashString(
        specFilename + testTitle + prompt,
      )
      if (!promptHash) {
        throw new Error('Prompt hash is required for caching')
      }

      if (promptHash in promptCache) {
        console.log('Using cached command for prompt:', prompt)
        const cached = promptCache[promptHash]
        return {
          command: cached.command,
          totalTokens: cached.totalTokens,
          fromCache: true,
          client: cached.client,
          model: cached.model,
          durationMs: cached.durationMs,
        }
      }
      const result = await think(
        {
          model,
          prompt,
          html,
          agentInstructions,
        },
        aiOptions,
      )

      // do not save the command just yet
      // wait until we know it is successful in the browser
      log('storing prompt to be cached later, hash %s', promptHash)
      waitingToCachePrompts[promptHash] = {
        prompt,
        ...result,
        specFilename,
        testTitle,
      }
      // await savePromptCache()

      return {
        command: result.command,
        totalTokens: result.totalTokens,
        fromCache: false,
        client: result.client,
        model: result.model,
        durationMs: result.durationMs,
        promptHash,
      }
    },
  })
}
