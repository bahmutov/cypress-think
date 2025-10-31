/// <reference path="../../src/index.d.ts" />
// @ts-check

describe('Hooks', { baseUrl: null }, () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/document.html')
  })

  it('has h1', () => {
    cy.get('h1').think('the text should be "Hello"')
  })

  afterEach(() => {
    cy.log('Test finished')
  })
})
