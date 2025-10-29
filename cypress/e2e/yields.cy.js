// @ts-check

it('yields the element', () => {
  cy.visit('/pages/forms/layouts')
  cy.get('.form-inline')
    .should('not.have.class', 'ng-submitted')
    .think('click on the submit button')
    .should('have.class', 'ng-submitted')
})
