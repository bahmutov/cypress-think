it('enters text into input', () => {
  cy.visit('/pages/forms/layouts')
  cy.get('.form-inline').should('not.have.class', 'ng-submitted')
    .think(`
      enter "Gleb B" into the username field
      enter "gleb@acme.co" into the email field
      click on the submit button
    `)
  cy.get('.form-inline').should('have.class', 'ng-submitted')
})
