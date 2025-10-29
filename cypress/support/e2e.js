Cypress.Commands.add('think', (prompt) => {
  if (!prompt) {
    throw new Error('A prompt is required for the think command')
  }
  cy.log('**thinking**')
})
