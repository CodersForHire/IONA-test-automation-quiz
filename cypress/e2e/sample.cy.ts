describe('Sample Smoke Test', () => {
  it('loads the homepage', () => {
    cy.visit('/');
    cy.title().should('include', 'STORE');
  });
});
