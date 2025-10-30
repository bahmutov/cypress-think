// @ts-check

it.skip('picks the October 29th in the date picker', () => {
  cy.visit('/pages/forms/datepicker')
  cy.get('[placeholder="Form Picker"]').click()
  cy.get('nb-datepicker-container').should('be.visible').think(`
    should show the name of the current month
    click "15" in the calendar
  `)
  cy.get('[placeholder="Form Picker"]').think(
    'should have value is the current month/15/currentYear',
  )
})
