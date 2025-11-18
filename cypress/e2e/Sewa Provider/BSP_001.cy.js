// cy.get('input[name="name"]').clear().type("Test@12#");
// cy.get('input[name="phoneNumber"]').clear().type("9810102020");

// //Select gender
// cy.contains("Select gender").click();
// cy.get('[role="option"]').contains("Male").click();

// //Add DOB
// cy.get('input[name="dob"]').click().type("2003-02-23");

//Add Location
// cy.get('button[type="button"]').contains("Add Location").click();
// cy.contains("button", "Search and Select location on Map").click();
// cy.get('input[placeholder="Search for a place"]').type(
//   "Swayambhu Marg, Kathmandu-17"
// );
// cy.get('button[type="submit"]')
//   .contains("button", "Search")
//   .click({ timeout: 2000 });
// cy.wait(2000);
// cy.contains(
//   "li",
//   "Swayambhu Marg, Kathmandu-17, Kathmandu Metropolitan City, Kathmandu, Bagamati Province, 44600, Nepal"
// ).click();
// cy.get('button[title="Choose a location"]').click();
// cy.get(".map-instance").click(200, 180);
// cy.contains("button", "Save Locations").click();

// //Add document number
// cy.get('input[placeholder="Enter document number"]').type("274563217");

// //Upload document
// cy.contains("label", "Citizenship Certificate - Front Side")
//   .parent()
//   .find('input[type="file"]')
//   .attachFile("imgs/Australia.png");
// cy.contains("label", "Citizenship Certificate - Back Side")
//   .parent()
//   .find('input[type="file"]')
//   .attachFile("imgs/Australia.png");



describe("Sewa Provider Verification Form Test - Step 1", () => {
  const testEmail = "tarogeb989@gyknife.com";

  beforeEach(() => {
    cy.viewport(1280, 960);

    cy.log("🔄 beforeEach started - checking session...");

    // Using Cypress Session to maintain login state and navigation
    cy.session(
      `sewaProviderAccess-${testEmail}`,
      () => {
        cy.log("🆕 SESSION CREATION: Running fresh login...");

        // Visit SewaVerse Home Page
        cy.visit("https://qc.sewaverse.com", { timeout: 10000 });
        cy.wait(2000); // Wait for page to load
        cy.log("Homepage loaded");

        // Visit login Page
        cy.contains("button", "Login", { timeout: 10000 })
          .should("be.visible")
          .click();

        cy.url({ timeout: 10000 }).should(
          "eq",
          "https://qc.sewaverse.com/login"
        );
        cy.log("Redirected to login page");

        // Login with valid credentials
        cy.get('input[name="email"]', { timeout: 10000 })
          .should("be.visible")
          .type(testEmail);
        cy.get('input[name="password"]').should("be.visible").type("Test@123");
        cy.get('button[type="submit"]', { timeout: 10000 })
          .should("be.visible")
          .click();

        // Wait for login to complete and cookies to be set
        cy.wait(3000);

        // Navigate to Verification page based on current state
        cy.url({ timeout: 10000 }).then((url) => {
          if (url.includes("sewa-provider/welcome")) {
            // Scenario 1: User is a sewa provider but has not submitted verification form yet
            cy.log("Scenario 1: User is already a Sewa Provider");
            cy.contains("button", "Get Started", { timeout: 10000 })
              .should("be.visible")
              .click();
            cy.wait(2000);
            cy.url().should("include", "/verification/step-1");
          } else if (url.includes("/profile") || url.includes("verification")) {
            // Scenario 3: User has already filled the verification form or already on verification
            cy.log("Scenario 3: User on profile or verification page");
          } else if (
            url === "https://qc.sewaverse.com" ||
            url === "https://qc.sewaverse.com/"
          ) {
            // Scenario 2: User is not a sewa provider yet
            cy.log("Scenario 2: User is not a Sewa Provider yet");
            cy.visit("https://qc.sewaverse.com/beasewaprovider", {
              timeout: 10000,
            });
            cy.wait(2000);

            cy.contains("button", "Become a Sewa Provider", { timeout: 10000 })
              .should("be.visible")
              .click();
            cy.wait(2000);

            cy.url().should("include", "sewa-provider/welcome");

            cy.contains("button", "Get Started", { timeout: 10000 })
              .should("be.visible")
              .click();
            cy.wait(2000);

            cy.url().should("include", "verification/step-1");
          } else {
            cy.log(`Unexpected URL: ${url}`);
          }
        });

        // Final wait to ensure session is fully established
        cy.wait(2000);
      },
      {
        validate() {
          // Make request to session endpoint
          cy.request({
            url: "https://qc.sewaverse.com/api/auth/session",
            failOnStatusCode: false,
          }).then((response) => {
            // Log response for debugging
            cy.log(`Session Status: ${response.status}`);
            cy.log(`Response Body: ${JSON.stringify(response.body)}`);

            // Only check status code - body might be null/empty for some auth systems
            expect(response.status).to.equal(200);

            // Don't fail on null body - some session APIs return minimal data
            // Just log a warning if body is empty
            if (!response.body || Object.keys(response.body).length === 0) {
              cy.log(
                "Warning: Session API returned empty body, but status is 200"
              );
            }
          });
        },
      }
    );

    // After session restoration, visit the verification page
    cy.visit("https://qc.sewaverse.com/sewa-provider/verification/step-1", {
      timeout: 10000,
      failOnStatusCode: false,
    });
    cy.wait(2000);
  });



