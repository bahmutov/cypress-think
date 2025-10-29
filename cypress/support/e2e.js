/// <reference path="./index.d.ts" />

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

Cypress.Commands.add(
  'think',
  {
    prevSubject: 'element',
  },
  (subject, prompt) => {
    if (!prompt) {
      throw new Error('A prompt is required for the think command')
    }
    cy.log('**thinking...**')

    // split prompt into individual lines
    const lines = prompt
      .trim()
      .split('\n')
      .map((line) => line.trim())
      // remove empty lines
      .filter(Boolean)

    // process each line within the subject element
    cy.wrap(subject, { log: false }).within(() => {
      lines.forEach(async (line, k) => {
        cy.log(`**step ${k + 1}: ${line}**`)
        cy.wrap(line, { log: false })
          // compute hash of the string to determine caching
          .then(hashString)
          .then((promptHash) => {
            cy.task(
              'cypress:think',
              {
                prompt: line,
                promptHash,
                // TODO: make sure to grab the latest HTML after previous commands
                html: subject?.html() || '',
              },
              { log: false },
            ).then(({ command, fromCache }) => {
              if (fromCache) {
                cy.log(`🤖⚡️ ${command}`)
              } else {
                cy.log(`🤖 ${command}`)
              }
              // execute the command
              // eslint-disable-next-line no-eval
              eval(command)
            })
          })
      })
    })
  },
)
