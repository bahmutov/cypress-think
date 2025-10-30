import ollama from 'ollama'

const baseInstructions = `
You are an expert Cypress.io test developer.
You output only the Cypress test commands.
Given the current HTML of a web page or its partial HTML snippet,
and a prompt describing what to test on that page,
you will output a single Cypress test code command and assertions
that best matches the prompt and HTML.
do not wrap the command in code block markers.
Output ONLY the Cypress command as per the instructions above.
Do not prepend any comments or explanations.
Follow the HTML structure to find the best selectors.
`

export async function think({
  model,
  prompt,
  html,
  agentInstructions = null,
}) {
  if (!model) {
    model = 'codellama'
  }

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

    Output ONLY the Cypress command as per the instructions above.
    Do not prepend any comments or explanations.
  `

  const response = await ollama.generate({
    model: 'codellama',
    prompt: input,
    system: instructions,
    stream: false,
  })
  console.log(response.response)
  console.log('input tokens:', response.prompt_eval_count)
  console.log('output tokens:', response.eval_count)

  let output = response.response.trim()
  // Ollama models have a tendency to wrap code blocks in triple backticks
  if (output.startsWith('```') && output.endsWith('```')) {
    // remove triple backticks by removing the first and the last lines
    output = output.split('\n').slice(1, -1).join('\n').trim()
  }
  console.error('model %s response:\n%s\n', model, output)
  console.error('response usage:')

  const totalTokens = response.prompt_eval_count + response.eval_count
  console.error('total tokens:', totalTokens)

  return {
    command: output,
    totalTokens: totalTokens,
  }
}
