/// <reference path="../../src/index.d.ts" />
// @ts-check

it('fills the grid form', () => {
  cy.visit('/pages/forms/layouts')
  const password = 'P@ssw0rd!'
  cy.contains('nb-card', 'Using the Grid').think(`
    enter "gleb@acme.co" into the email field
    enter "${password}" into the password field
    // click "Option 2" text
    confirm the "Sign in" button is enabled
  `)
})
