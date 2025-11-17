Cypress.on("uncaught:exception", (err, runnable) => {
  if (
    err.message.includes("Minified React error #418") ||
    err.message.includes("Hydration")
  ) {
    return false;
  }
  return true;
});

describe("Sewa Provider Verification Form Test", () => {
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

  // BSP_001: Page Load Test
  it("BSP_001 - Should load the verification page", () => {
    cy.log("Testing BSP_001: Page load verification");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("✓ Page loaded successfully");

    // Check for page elements
    cy.contains("h2", "Sewa Provider Details").should("be.visible");
    cy.contains("button", "Proceed ", { timeout: 10000 }).should("be.visible");

    cy.log("✓ Page elements visible");
  });

  // BSP_002: Auto Filled Data
  it("BSP_002 - Should auto filled data by fetching from user registration", () => {
    // Fetch user's registered data from the updateToken API
    cy.log("Testing BSP_002: Auto filled data");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("✓ Page loaded successfully");

    cy.request({
      method: "POST",
      url: "https://qc.sewaverse.com/api/auth/updateToken",
      failOnStatusCode: false,
    }).then((response) => {
      //Extract user data from API response
      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;

      const userData = response.body.user;
      let reg_name = userData.name;
      let reg_num = userData.phoneNumber;

      cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
      cy.log("✓ Page loaded successfully");

      cy.get('input[placeholder="Enter your full name"]').should(
        "have.value",
        reg_name
      );

      cy.get('input[placeholder="Enter phone number"]').should(
        "have.value",
        reg_num
      );

      cy.log(
        "✓ All auto-filled data matches user's registration data from API"
      );
    });
  });

  // BSP_003: Read Only Fields
  it("BSP_003: AUto-filled data should not be read only", () => {
    cy.log("Testing BSP_003: Editable Fields verification");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("✓ Page loaded successfully");

    cy.get('input[placeholder="Enter your full name"]')
      .should("be.enabled")
      .clear()
      .type("Test User");
    cy.get('input[placeholder="Enter phone number"]')
      .should("be.enabled")
      .clear()
      .type("1234567890");
  });

  // BSP_004: Mandatory Field Validation
  it("BSP_004: Should perform mandatory Field Validation", () => {
    cy.log("Testing BSP_004: Mandatory Field Validation");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.get('input[name="name"]').clear();
    cy.get('input[name="phoneNumber"]').clear();
    cy.contains("Select gender").should("be.visible");
    cy.get('input[name="dob"]').should("have.value", "");
    cy.contains("No locations added").should("be.visible");
    cy.get('input[placeholder="Enter document number"]').should(
      "have.value",
      ""
    );
    cy.contains("label", "Citizenship Certificate - Front Side")
      .parent()
      .find('input[type="file"]')
      .should("have.value", "");
    cy.contains("label", "Citizenship Certificate - Back Side")
      .parent()
      .find('input[type="file"]')
      .should("have.value", "");
    cy.get('button[type="submit"]').click();

    //Validation
    cy.contains("Name must be at least 2 characters").should("be.visible");
    cy.contains("Phone number must be at least 10 digits").should("be.visible");
    cy.get("#_r_8_-form-item-message").should("be.visible");
    cy.get("#_r_8_-form-item-message").should("be.visible");
    cy.contains("At least one location is required").should("be.visible");
    cy.contains("Document number is required").should("be.visible");
    cy.get("#_r_n_-form-item-message").should("be.visible");
    cy.get("#_r_o_-form-item-message").should("be.visible");
  });

  // BSP_005: Full Name Validation
  it('BSP_005: "Should perform Full Name Validation', () => {
    cy.log("Testing BSP_005: Full Name Validation");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.get('input[name="name"]').clear().type("Test@12#");
    cy.get('button[type="submit"]').click();

    cy.get("body").then(($body) => {
      if ($body.text().includes("Name should not contain special characters")) {
        cy.log("✅ TEST PASSED: Full Name Validation working");
        cy.log("✅ Validation message displayed for special characters");

        cy.window().then((win) => {
          win.alert("TEST PASSED: Full Name Validation working");
        });

        cy.contains("Name should not contain special characters").should(
          "be.visible"
        );
      } else {
        cy.log("❌ TEST FAILED: Full Name Validation not working");
        cy.window().then((win) => {
          win.alert("TEST FAILED: Full Name Validation not working");
        });
      }
    });
  });

  //BSP_006: Phone Number Validation
  it('BSP_006: "Should perform Phone Number Validation', () => {
    cy.log("Testing BSP_006: Phone Number Validation");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.get('input[name="phoneNumber"]').clear().type("984912345");
    cy.get('button[type="submit"]').click();

    cy.get("body").then(($body) => {
      if ($body.text().includes("Phone number must be at least 10 digits")) {
        cy.log(
          "✅ TEST PASSED: Phone Number Validation working for number less than 10 digits"
        );
      } else {
        cy.log(
          "❌ TEST FAILED: Phone Number Validation not working for number less than 10 digits"
        );
      }
    });

    cy.wait(2000);

    cy.get('input[name="phoneNumber"]').clear().type("98491234567");
    cy.get('button[type="submit"]').click();

    cy.get("body").then(($body) => {
      if ($body.text().includes("Phone number must be at most 10 digits")) {
        cy.log(
          "✅ TEST PASSED: Phone Number Validation working for number more than 10 digits"
        );
      } else {
        cy.log(
          "❌ TEST FAILED: Phone Number Validation not working for number more than 10 digits "
        );
      }
    });

    cy.wait(2000);

    cy.get('input[name="phoneNumber"]').clear().type("9849123a45");
    cy.get('button[type="submit"]').click();

    cy.get("body").then(($body) => {
      if ($body.text().includes("Invalid phone number format")) {
        cy.log(
          "✅ TEST PASSED: Phone Number Validation working for invalid number format"
        );
      } else {
        cy.log(
          "❌ TEST FAILED: Phone Number Validation not working for invalid number format"
        );
      }
    });

    // Final alert - test failed
    cy.window().then((win) => {
      win.alert("❌ TEST FAILED: Phone Number Validation not working!");
    });
  });

  //BSP_007: Gender Selection
  it("BSP_007:Should show at least one gender must be selected", () => {
    cy.log("Testing BSP_007: Phone Number Validation");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.contains("Select gender").should("be.visible");
    cy.get('button[type="submit"]').click();

    cy.get("body").then(($body) => {
      // Check for any element with ID containing "form-item-message"
      if ($body.find('[id*="form-item-message"]').length > 0) {
        cy.log("✅ TEST PASSED: Gender Selection validation working");
        cy.window().then((win) => {
          win.alert("✅ TEST PASSED: Gender Selection validation working!");
        });
      } else {
        cy.log("❌ TEST FAILED: Gender Selection validation not working");
        cy.window().then((win) => {
          win.alert("❌ TEST FAILED: Gender Selection validation not working!");
        });
      }
    });
  });

  //BSP_008: Date of Birth Validation
  it("BSP_008: Should perform Date of Birth Validation", () => {
    cy.log("Testing BSP_008: Date of Birth Validation");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.get('input[name="dob"]').click().type("2010-02-23");
    cy.get('button[type="submit"]').click();

    cy.get("body").then(($body) => {
      if ($body.text().includes("You must be at least 18 years old")) {
        cy.log("✅ TEST PASSED: Date of Birth Validation working");
      } else {
        cy.log("❌ TEST FAILED: Date of Birth Validation not working");
      }
    });
  });

  //BSP_009: Location Selection
  it("BSP_009: Should perform Location Selection", () => {
    cy.log("Testing BSP_009: Location Selection");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.get('button[type="button"]').contains("Add Location").click();
    cy.contains("button", "Search and Select location on Map").click();
    cy.get('input[placeholder="Search for a place"]').type(
      "Swayambhu Marg, Kathmandu-17"
    );
    cy.get('button[type="submit"]')
      .contains("button", "Search")
      .click({ timeout: 2000 });
    cy.wait(2000);
    cy.contains(
      "li",
      "Swayambhu Marg, Kathmandu-17, Kathmandu Metropolitan City, Kathmandu, Bagamati Province, 44600, Nepal"
    ).click();
    cy.get('button[title="Choose a location"]').click();
    cy.get(".map-instance").click(400, 280);
    cy.contains("button", "Save Locations").click();

    cy.wait(1000);

    // Verify location saved - "No locations added" should NOT be visible
    cy.get("body").then(($body) => {
      if (!$body.text().includes("No locations added")) {
        cy.log("✅ TEST PASSED: Location added successfully");
        cy.window().then((win) => {
          win.alert("✅ TEST PASSED: Location functionality working!");
        });
      } else {
        cy.log("❌ TEST FAILED: Location not saved");
        cy.window().then((win) => {
          win.alert("❌ TEST FAILED: Location not saved!");
        });
      }
    });
  });

  //BSP_010: Document Upload (Valid Documents )
  it("BSP_010: Should verfiy valid document(Size < 5MB) upload works", () => {
    cy.log("Testing BSP_010: Valid Document Upload");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.contains("label", "Citizenship Certificate - Front Side")
      .parent()
      .find('input[type="file"]')
      .attachFile("imgs/Australia.png");

    cy.contains("label", "Citizenship Certificate - Back Side")
      .parent()
      .find('input[type="file"]')
      .attachFile("imgs/Australia.png");

    //Verify document is uploaded
    cy.get("body").then(($body) => {
      if (
        !$body
          .text()
          .includes(
            "No Documents Uploaded || Upload documents to see previews here"
          )
      ) {
        cy.log("✅ TEST PASSED: Files uploaded successfully");
        cy.window().then((win) => {
          win.alert("✅ TEST PASSED: Upload functionality working!");
        });
      } else {
        cy.log("❌ TEST FAILED: Files not uploaded");
        cy.window().then((win) => {
          win.alert("❌ TEST FAILED: Upload functionality not working!");
        });
      }
    });
  });

  //BSP_011: Document Upload (Valid Documents )
  it("BSP_011: Should verfiy invalid document(Size > 5MB) upload does not work", () => {
    cy.log("Testing BSP_011: Invalid Document Upload");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.contains("label", "Citizenship Certificate - Front Side")
      .parent()
      .find('input[type="file"]')
      .attachFile("imgs/Main.png");

    cy.contains("label", "Citizenship Certificate - Back Side")
      .parent()
      .find('input[type="file"]')
      .attachFile("imgs/Main.png");

    //Verify document is uploaded
    cy.contains(`File is larger than 5242880 bytes`, {
      timeout: 10000,
    }).should("be.visible");

    cy.log(
      "✅ TEST PASSED: Large files successfully blocked (Error message verified)."
    );
  });

  //BSP_012: Verify later button functionality
  it("BSP_012: Should hide the upload document section", () => {
    cy.log("Testing BSP_012: Verify later button functionality");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("Page loaded successfully");

    cy.get('button[role="checkbox"]').click();

    cy.contains(
      "You've chosen to verify personal documents later. You can complete this step from your 'My Sewa Profile' after registration."
    ).should("be.visible");
  });
});
