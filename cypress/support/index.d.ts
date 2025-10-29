// Custom Cypress command type declarations
// Generated to provide IntelliSense and type safety for custom commands
// defined in `cypress/support/e2e.js`.

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      think(prompt: string): void
    }
  }
}

export {}
