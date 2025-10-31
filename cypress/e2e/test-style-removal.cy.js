// @ts-check

it('removes style elements from HTML before passing to AI', { baseUrl: null }, () => {
  cy.visit('cypress/e2e/test-style-removal.html')
  cy.think(`
    find the greeting and confirm it says "Hello World"
  `)
})
