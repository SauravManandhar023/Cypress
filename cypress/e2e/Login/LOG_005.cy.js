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

describe("Login Test 005 - Email Case Insensitivity", () => {
  beforeEach(() => {
    cy.visit("https://qc.sewaverse.com/login");
  });

  it("Should login with email in lower cases", () => {
    cy.intercept("POST", "**/api/auth/callback/credentials*").as(
      "loginRequest"
    );

    cy.get('input[name="email"]').type("sokaxe4630@naqulu.com");
    cy.get('input[name="password"]').type("Test@123");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest").then((interception) => {
      // Network Validation
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.url).to.eq(
        "https://qc.sewaverse.com/login"
      );
      expect(interception.response.body.url).to.not.include(
        "error=CredentialsSignin"
      );
      expect(interception.response.body.url).to.not.include(
        "code=Invalid+credentials"
      );
      //UI Validation
      cy.url().should("eq", "https://qc.sewaverse.com/");
      cy.contains("Featured Sewas").should("be.visible");
    });
  });

  it("Should login with email in upper cases", () => {
    cy.intercept("POST", "**/api/auth/callback/credentials*").as(
      "loginRequest"
    );

    cy.get('input[name="email"]').type("SOKAXE4630@NAQULU.com");
    cy.get('input[name="password"]').type("Test@123");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest").then((interception) => {
      // Network Validation
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.url).to.eq(
        "https://qc.sewaverse.com/login"
      );
      expect(interception.response.body.url).to.not.include(
        "error=CredentialsSignin"
      );
      expect(interception.response.body.url).to.not.include(
        "code=Invalid+credentials"
      );
      //UI Validation
      cy.url().should("eq", "https://qc.sewaverse.com/");
      cy.contains("Featured Sewas").should("be.visible");
    });
  });
});
