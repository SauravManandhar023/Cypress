Cypress.on("uncaught:exception", (err, runnable) => {
  if (
    err.message.includes("Minified React error #418") ||
    err.message.includes("Hydration") ||
    err.message.includes("Description must be at least 50 characters") ||
    err.message.includes("too_small")
  ) {
    return false;
  }
  return true;
});

describe("Login Test 006 - Incorrect Password", () => {
  beforeEach(() => {
    cy.visit("https://qc.sewaverse.com/login");
  });

  it("Should not login with incorrect password", () => {
    cy.intercept("POST", "**/api/auth/callback/credentials*").as(
      "loginRequest"
    );

    cy.get('input[name="email"]').type("wotatey216@nyfhk.com");
    cy.get('input[name="password"]').type("Test@123456789");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest").then((interception) => {
      //Network Validation
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.url).to.include(
        "error=CredentialsSignin"
      );
      expect(interception.response.body.url).to.include(
        "code=Invalid+credentials"
      );

      //UI validation
      cy.url().should("eq", "https://qc.sewaverse.com/login");
      cy.contains("Invalid credentials").should("be.visible");
    });
  });
});
