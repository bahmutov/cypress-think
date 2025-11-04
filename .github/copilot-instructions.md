# Cypress Think Project Instructions

This project uses Cypress for end-to-end testing. When generating Cypress commands:

- Always use modern Cypress syntax (avoid deprecated commands)
- Prefer `cy.contains(selector, text)` to `cy.get(selector).contains(text)`
- Prefer `.should()` assertions over `.then()` when possible
- Use descriptive selectors (prefer data-test attributes when available)
- check the CSS selector against the given HTML snippet
- if data-testid attribute is unavailable, check other attributes like placeholder, id, class, name, aria-label, role
- Keep commands concise and focused on a single action
- Chain commands only when operating on the same element
