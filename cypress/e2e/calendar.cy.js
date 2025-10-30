// @ts-check

it('picks the 20th of the current month', () => {
  cy.visit('/pages/extra-components/calendar')
  cy.get('nb-calendar').first().think(`
    shows the today's date as selected cell
    find the day "20" and click on it
    day "20" should now be selected
  `)
})
