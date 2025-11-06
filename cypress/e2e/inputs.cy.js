/// <reference path="../../src/index.d.ts" />
// @ts-check

it('enters text into input', () => {
  cy.visit('/pages/forms/layouts')
  cy.get('.form-inline').should('not.have.class', 'ng-submitted')
    .think(`
      enter "Gleb Bah" into the username field
      enter "gleb@acme.co" into the email field
      click checkbox with text "Remember me"
      click on the button with text "Submit"
      confirm the username field contains "Gleb Bah"
    `)

  cy.get('.form-inline').should('have.class', 'ng-submitted')
})
