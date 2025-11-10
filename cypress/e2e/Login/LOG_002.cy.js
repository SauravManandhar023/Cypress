describe('Login Test 002 - Empty Fields', () => {

    beforeEach(() => {
        cy.visit('https://qc.sewaverse.com/login');
    });

    it('Should not login with empty email and password fields', () => {

        cy.get('button[type="submit"]').click();

        //NO Netwerk validation as no request is made
        // UI Validation
        cy.url().should('eq', 'https://qc.sewaverse.com/login');
        cy.contains('Email is required').should('be.visible');
        cy.contains('Password is required').should('be.visible'); 
    });
});