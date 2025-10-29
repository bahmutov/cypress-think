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

const instructions = `
You are an expert Cypress.io test developer.
Given the current HTML of a web page or its partial HTML snippet,
and a prompt describing what to test on that page,
you will output a single Cypress test code command and assertions
that best matches the prompt and HTML.
output only the Cypress command without any explanations or additional text.
`

export async function think({ prompt, html }) {
  const model = 'gpt-4.1'

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

  return output
}

// example
// const prompt = 'enter "Gleb B" into the username field'
// const html = `
//   <form _ngcontent-swh-c194="" novalidate="" class="form-inline ng-untouched ng-pristine ng-valid"><input _ngcontent-swh-c194="" type="text" nbinput="" fullwidth="" placeholder="Jane Doe" class="input-full-width size-medium status-basic shape-rectangle nb-transition"><input _ngcontent-swh-c194="" type="text" nbinput="" fullwidth="" placeholder="Email" class="input-full-width size-medium status-basic shape-rectangle nb-transition"><nb-checkbox _ngcontent-swh-c194="" _nghost-swh-c111="" class="status-basic nb-transition"><label _ngcontent-swh-c111="" class="label"><input _ngcontent-swh-c111="" type="checkbox" class="native-input visually-hidden"><span _ngcontent-swh-c111="" class="custom-checkbox"><!----><!----></span><span _ngcontent-swh-c111="" class="text">Remember me</span></label></nb-checkbox><button _ngcontent-swh-c194="" type="submit" nbbutton="" status="primary" aria-disabled="false" tabindex="0" class="appearance-filled size-medium shape-rectangle status-primary nb-transition">Submit</button></form>
// `
// think({ prompt, html })
