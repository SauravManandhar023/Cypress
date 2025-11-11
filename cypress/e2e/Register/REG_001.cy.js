describe("Registration Test 001 - Valid Registration", () => {
  let testEmail;
  let emailUsername;

  beforeEach(() => {
    // Set viewport and visit the application
    cy.viewport(1280, 1080);
    cy.visit("https://qc.sewaverse.com");
  });

  it("Should register a new user successfully", () => {
    // Unique email for each test
    emailUsername = `testuser${Date.now()}`;
    testEmail = `${emailUsername}@mailinator.com`;

    // 1. Start Registration Flow (User role, Individual type)
    cy.log("Starting registration for " + testEmail);
    cy.get('a[href="/account-type?role=user"]').click();
    cy.url().should("include", "/account-type?role=user");

    cy.get('button[value="individual"]').click();
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/register");

    // 2. Fill registration form
    cy.get('input[placeholder="Full Name"]').type(emailUsername);
    cy.get('input[placeholder="Mobile Number"]').type("9800000001");
    cy.get('input[placeholder="Email Address"]').type(testEmail);
    cy.get('input[placeholder="New Password"]').type("Test@123");
    cy.get('button[type="submit"]').click();
    cy.log("Registration submitted. Waiting for email.");

    // 3. Wait for email to arrive (Increased wait time for reliability)
    cy.wait(10000);

    // 4. Use cy.origin to interact with Mailinator
    cy.origin(
      "https://www.mailinator.com",
      { args: { emailUsername } },
      ({ emailUsername }) => {
        // Go to Mailinator inbox
        cy.visit(
          `https://www.mailinator.com/v4/public/inboxes.jsp?to=${emailUsername}`
        );

        // Wait for and click on the first email (using a more specific selector)
        cy.wait(5000);
        cy.get(".jambo_table").first().click();
        cy.contains("Verify Email Address").click({ force: true });
      }
    );
  });
});
