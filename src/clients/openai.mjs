// TODO: abstract into pluggable AI clients

import OpenAI from 'openai'

const baseInstructions = `
You are an expert Cypress.io test developer.
Given the current HTML of a web page or its partial HTML snippet,
and a prompt describing what to test on that page,
you will output a single Cypress test code command and assertions
that best matches the prompt and HTML.
output only the Cypress command without any explanations or additional text.
`

export async function think(
  { model, prompt, html, agentInstructions = null },
  aiOptions = {},
) {
  if (!model) {
    model = 'gpt-4.1'
  }

  const openAiApiKey = process.env['OPEN_AI_API_KEY']
  if (!openAiApiKey) {
    throw new Error(
      'OPEN_AI_API_KEY environment variable is required',
    )
  }
  const openAiBaseUrl =
    process.env['OPEN_AI_BASE_URL'] || 'https://api.openai.com/v1'
  if (!openAiBaseUrl) {
    throw new Error(
      'OPEN_AI_BASE_URL environment variable is required',
    )
  }

  const client = new OpenAI({
    apiKey: openAiApiKey,
    baseURL: openAiBaseUrl,
  })

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

  const startTime = Date.now()
  const response = await client.responses.create({
    model,
    instructions,
    input,
    ...aiOptions,
  })
  const endTime = Date.now()
  const durationMs = endTime - startTime

  const output = response.output_text.trim()
  console.error('model %s response:\n%s\n', model, output)
  console.error('response usage:')
  console.error(response.usage)

  return {
    command: output,
    totalTokens: response.usage?.total_tokens || 0,
    client: 'openai',
    model,
    durationMs,
  }
}
