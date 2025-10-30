// @ts-check

it('takes the page html', { baseUrl: null }, () => {
  cy.visit('cypress/e2e/document.html')
  cy.think(`
    find the greeting and confirm it says "Hello"...
  `)
})
