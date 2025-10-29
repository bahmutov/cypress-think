// @ts-check

it('supports an array of strings', () => {
  cy.visit('/pages/forms/layouts')
  cy.get('.form-inline')
    .should('not.have.class', 'ng-submitted')
    .think([
      `enter "Gleb Bah" into the username field`,
      'confirm the "Remember me" is unchecked',
      'confirm the Submit button is enabled',
    ])
})
