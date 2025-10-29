Cypress.Commands.add(
  'think',
  {
    prevSubject: 'element',
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

    // process each line within the subject element
    cy.wrap(subject, { log: false }).within(() => {
      lines.forEach((line, k) => {
        cy.log(`**step ${k + 1}: ${line}**`)
        cy.task(
          'cypress:think',
          {
            prompt: line,
            html: subject?.html() || '',
          },
          { log: false },
        ).then((command) => {
          cy.log(`🤖 ${command}`)
          // execute the command
          // eslint-disable-next-line no-eval
          eval(command)
        })
      })
    })
  },
)
