// @ts-check

it(
  'supports parent command',
  { baseUrl: 'https://glebbahmutov.com', scrollBehavior: 'center' },
  () => {
    cy.visit('/cypress-examples/')
    // normal command
    cy.title().should('include', 'Cypress Examples')

    cy.think(`
      the page title should include "Cypress Examples"
    `)

    cy.log('**Parent command with HTML**')
    cy.think(`
      in the main area find the anchor element with the text "Navigation" and scroll to it
    `)
  },
)
