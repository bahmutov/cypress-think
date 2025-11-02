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
})
