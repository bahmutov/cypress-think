// TODO: abstract into pluggable AI clients

import OpenAI from 'openai'

const openAiApiKey = process.env['OPEN_AI_API_KEY']
if (!openAiApiKey) {
  throw new Error('OPEN_AI_API_KEY environment variable is required')
}
const openAiBaseUrl =
  process.env['OPEN_AI_BASE_URL'] || 'https://api.openai.com/v1'
if (!openAiBaseUrl) {
  throw new Error('OPEN_AI_BASE_URL environment variable is required')
}

const client = new OpenAI({
  apiKey: openAiApiKey,
  baseURL: openAiBaseUrl,
})

const baseInstructions = `
You are an expert Cypress.io test developer.
Given the current HTML of a web page or its partial HTML snippet,
and a prompt describing what to test on that page,
you will output a single Cypress test code command and assertions
that best matches the prompt and HTML.
output only the Cypress command without any explanations or additional text.
`

export async function think({
  prompt,
  html,
  agentInstructions = null,
}) {
  // TODO: cache the response based on the prompt and HTML hash

  const model = 'gpt-4.1'

  // Combine base instructions with agent instructions if provided
  let instructions = baseInstructions
  if (agentInstructions) {
    instructions = `${baseInstructions}

Additional project-specific instructions:
${agentInstructions}
`
  }

  const input = `
    HTML:
    ${html}

    Cypress test command prompt:
    ${prompt}
  `

  const response = await client.responses.create({
    model,
    instructions,
    input,
  })

  const output = response.output_text.trim()
  console.error('model %s response:\n%s\n', model, output)
  console.error('response usage:')
  console.error(response.usage)

  return {
    command: output,
    totalTokens: response.usage?.total_tokens || 0,
  }
}
