describe("Login Test 001 - Valid Registration", () => {
  beforeEach(() => {
    cy.visit("https://qc.sewaverse.com/login");
  });

  it("Should login with valid credentials", () => {
    cy.intercept("POST", "**/api/auth/callback/credentials*").as(
      "loginRequest"
    );

    cy.get('input[name="email"]').type("wotatey216@nyfhk.com");
    cy.get('input[name="password"]').type("Test@123");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest").then((interception) => {
      // Network Validation
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.url).to.eq("https://qc.sewaverse.com/login");
      expect(interception.response.body.url).to.not.include('error=').and.not.include('CredentialsSignin');
      expect(interception.response.body.url).to.not.include("code=Invalid+credentials");
    });
    // UI Validation
      cy.url().should("eq", "https://qc.sewaverse.com/");
      cy.contains("Featured Sewas").should("be.visible");
  });
});
