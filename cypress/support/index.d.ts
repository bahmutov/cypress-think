// Custom Cypress command type declarations
// Generated to provide IntelliSense and type safety for custom commands
// defined in `cypress/support/e2e.js`.

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Takes the given prompt string
       * and creates Cypress commands to execute it.
       * Each line is processed at a time, and it uses
       * the current DOM html as context.
       * Yields the original element subject.
       *
       * @example
       * cy.get('form').think(`
       *   enter "myusername" into the username field
       *   enter "mypassword" into the password field
       *   click on the submit button
       * `)
       */
      think(prompt: string): Chainable<Subject>

      /**
       * Takes an array of prompt strings
       * and creates Cypress commands to execute them.
       * Each line is processed at a time, and it uses
       * the current DOM html as context.
       * Yields the original element subject.
       *
       * @example
       * cy.get('form').think([
       *   `enter "myusername" into the username field`,
       *   `enter "mypassword" into the password field`,
       *   `click on the submit button`,
       * ])
       */
      think(prompts: string[]): Chainable<Subject>
    }
  }
}

export {}
