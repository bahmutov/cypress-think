Cypress.Commands.add(
  'think',
  {
    prevSubject: 'optional',
  },
  (subject, prompt) => {
    console.log({ subject, prompt })

    if (!prompt) {
      throw new Error('A prompt is required for the think command')
    }
    cy.log('**thinking**')

    // split prompt into individual lines
    const lines = prompt
      .trim()
      .split('\n')
      .map((line) => line.trim())

    // process each line
    lines.forEach((line, k) => {
      cy.log(`**step ${k + 1}: ${line}**`)
    })
  },
)
