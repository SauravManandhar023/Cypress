describe('Login Test 003 - Invalid Email', () => {

    const emails = [
        '@gmail.com',
        'testusergmail.com',
        'testuser@',
        'testuser@gma!l.com',
        '$aurav@gmail.com',
        'test@@example.com'
    ];

    beforeEach(() => {
        cy.visit('https://qc.sewaverse.com/login');
    });

    it('Should not login with invalid email', () => {

        emails.forEach((email) => {
            cy.get('input[name="email"]').clear().type(email);
            cy.get('input[name="password"]').clear().type('Test@123');
            cy.get('button[type="submit"]').click();
            cy.wait(1000);
        });

        //UI validation
        cy.url().should('eq', 'https://qc.sewaverse.com/login');
        cy.contains("Invalid email address").should('be.visible');
    });

});