// @ts-check

it(
  'supports parent command',
  { baseUrl: 'https://glebbahmutov.com' },
  () => {
    cy.visit('/cypress-examples/')
    // normal command
    cy.title().should('include', 'Cypress Examples')

    cy.think(`
      the page title should include "Cypress Examples"
    `)
  },
)
