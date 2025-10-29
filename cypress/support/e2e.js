/// <reference path="./index.d.ts" />

Cypress.Commands.add(
  'think',
  {
    prevSubject: 'element',
  },
  (subject, prompt) => {
    if (!prompt) {
      throw new Error('A prompt is required for the think command')
    }
    if (Array.isArray(prompt)) {
    }

    cy.log('**thinking...**')

    // split prompt into individual lines
    const lines = (
      Array.isArray(prompt) ? prompt : prompt.trim().split('\n')
    )
      .map((line) => line.trim())
      // remove empty lines
      .filter(Boolean)

    // process each line within the subject element
    cy.wrap(subject, { log: false }).within(() => {
      lines.forEach(async (line, k) => {
        cy.log(`**step ${k + 1}: ${line}**`)

        cy.task(
          'cypress:think',
          {
            prompt: line,
            // TODO: make sure to grab the latest HTML after previous commands
            html: subject?.html() || '',
            specFilename: Cypress.spec.relative,
            testTitle: Cypress.currentTest.titlePath.join(' > '),
          },
          { log: false },
        ).then(({ command, totalTokens, fromCache }) => {
          if (fromCache) {
            cy.log(`🤖⚡️ ${command} (${totalTokens} tokens)`)
          } else {
            cy.log(`🤖 ${command} (${totalTokens} tokens saved)`)
          }
          // execute the command
          // eslint-disable-next-line no-eval
          eval(command)
        })
      })
    })
  },
)
