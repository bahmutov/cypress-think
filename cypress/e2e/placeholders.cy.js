/// <reference path="../../src/index.d.ts" />
// @ts-check

describe('Placeholders', { baseUrl: null }, () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/placeholders.html')
  })
  it('enters the placeholder name', () => {
    const name = 'Ann Marie'
    cy.think(
      'enter {{name}} into the input with placeholder "Enter name"',
      {
        placeholders: { name },
      },
    )
    cy.get('input[placeholder="Enter your name"]').should(
      'have.value',
      name,
    )
  })

  it('enters the placeholder name into the right input field', () => {
    const name = 'Ann Marie'
    cy.think(
      `
      enter {{name}} into the name input
      enter {{name}} into the email input
    `,
      {
        placeholders: { name, email: 'joe@acme.co' },
      },
    )
    cy.get('input[placeholder="Enter your name"]').should(
      'have.value',
      name,
    )
  })

  it('uses the attribute selector', () => {
    cy.think(
      'using cy.contains the page contains the heading with text "Placeholders"',
    )
  })
})
