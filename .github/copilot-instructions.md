# Cypress Think Project Instructions

This project uses Cypress for end-to-end testing. When generating Cypress commands:

- Always use modern Cypress syntax (avoid deprecated commands)
- Prefer `.should()` assertions over `.then()` when possible
- Use descriptive selectors (prefer data-test attributes when available)
- if data-testid attribute is unavailable, check other attributes like placeholder, id, class, name, aria-label, role
- Prefer `cy.contains(selector, text)` to `cy.get(selector).contains(text)`
- Keep commands concise and focused on a single action
- Chain commands only when operating on the same element
