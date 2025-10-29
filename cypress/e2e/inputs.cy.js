// @ts-check

it('enters text into input', () => {
  cy.visit('/pages/forms/layouts')
  cy.get('.form-inline').should('not.have.class', 'ng-submitted')
    .think(`
      enter "Gleb Bah" into the username field
      enter "gleb@acme.co" into the email field
      click on the submit button

      confirm the username field contains "Gleb Bah"
    `)

  cy.get('.form-inline').should('have.class', 'ng-submitted')
})
