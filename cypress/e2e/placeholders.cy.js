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

  it('enters the placeholders', () => {
    const name = 'Ann Marie'
    const email = 'ann@example.com'
    cy.think(
      [
        'enter string {{name}} into the name input',
        'enter into the email input {{email}}',
      ],
      {
        placeholders: { name, email },
      },
    )
    cy.get('input[placeholder="Enter your name"]').should(
      'have.value',
      name,
    )
  })

  it.skip('does not cache unsuccessful command', () => {
    // enter some gibberish that will produce invalid command
    // to confirm that this command is not cached
    cy.think('xyz abc 123 ~~~~~~')
    // cy.think(
    //   'enter "Mary" into the input with placeholder "Enter name"',
    // )
  })

  // needs project id and Cypress cloud connection
  it.skip('enters the placeholder name (cy.prompt)', () => {
    const name = 'Ann Marie'
    cy.prompt(
      ['enter {{name}} into the input with placeholder "Enter name"'],
      {
        placeholders: { name },
      },
    )
    cy.get('input[placeholder="Enter your name"]').should(
      'have.value',
      name,
    )
  })
})
