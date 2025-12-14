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

describe("Login Test 002 - Empty Fields", () => {
  beforeEach(() => {
    cy.visit("https://qc.sewaverse.com/login");
  });

  it("Should not login with empty email and password fields", () => {
    cy.get('button[type="submit"]').click();

    //NO Netwerk validation as no request is made
    // UI Validation
    cy.url().should("eq", "https://qc.sewaverse.com/login");
    cy.contains("Email is required").should("be.visible");
    cy.contains("Password is required").should("be.visible");
  });
});
