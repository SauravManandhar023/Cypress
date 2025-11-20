Cypress.on("uncaught:exception", (err, runnable) => {
  if (
    err.message.includes("Minified React error #418") ||
    err.message.includes("Hydration")
  ) {
    return false;
  }
  return true;
});

describe("Sewa Provider Verification Form Test - Step 2", () => {
  const testEmail = "towadax189@gusronk.com";

  beforeEach(() => {
    cy.viewport(1280, 1280);

    cy.session(
      `sewaProviderAccess-${testEmail}`,
      () => {
        cy.log("🆕 NEW SESSION CREATION: Running fresh login...");

        //Visit Sewaverse page
        cy.visit("https://qc.sewaverse.com", { timeout: 10000 });
        cy.wait(2000);
        cy.log("Homepage Loaded");

        //Visit login page
        cy.contains("button", "Login", { timeout: 10000 })
          .should("be.visible")
          .click();
        cy.url({ timeout: 10000 }).should(
          "eq",
          "https://qc.sewaverse.com/login"
        );
        cy.log("Redirected to login page");

        //Login with valid credentials
        cy.get('input[name="email"]', { timeout: 10000 })
          .should("be.visible")
          .type(testEmail);
        cy.get('input[name="password"]').should("be.visible").type("Test@123");
        cy.get('button[type="submit"]', { timeout: 10000 })
          .should("be.visible")
          .click();
        cy.wait(3000);

        // Check where user lands after login
        cy.url({ timeout: 10000 }).then((url) => {
          if (url.includes("/login")) {
            cy.log("❌ Login Failed");
            throw new Error("Login failed - still on login page");
          } else if (url.includes("sewa-provider/welcome")) {
            cy.log("✅ User is already a sewa-provider");
            cy.contains("button", "Get Started", { timeout: 10000 })
              .should("be.visible")
              .click();
            cy.wait(2000);

            // After clicking "Get Started", check where we land
            cy.url({ timeout: 10000 }).then((newUrl) => {
              if (newUrl.includes("verification/step-1")) {
                cy.log("User redirected to step-1 - needs to fill form");
                fillStep1Form();
              } else if (newUrl.includes("verification/step-2")) {
                cy.log("✅ User already completed step-1 - directly on step-2");
                // No need to fill step-1, already on step-2
              }
            });
          } else if (url.includes("/profile")) {
            cy.log("⚠️ User has already completed entire verification");
            // User already completed everything
          } else if (
            url === "https://qc.sewaverse.com" ||
            url === "https://qc.sewaverse.com/"
          ) {
            cy.log("User is not a sewa-provider yet");

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

            // New user, will be on step-1
            cy.url().should("include", "verification/step-1");
            fillStep1Form();
          } else {
            cy.log(`⚠️ Unexpected URL: ${url}`);
          }
        });

        // Ensure we're on step-2 before ending session creation
        cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
        cy.log("✅ Session setup complete - on Step-2");
      },
      {
        validate() {
          cy.request({
            url: "https://qc.sewaverse.com/api/auth/session",
            failOnStatusCode: false,
          }).then((response) => {
            cy.log(`Session Status: ${response.status}`);
            expect(response.status).to.equal(200);

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
    cy.visit("https://qc.sewaverse.com/sewa-provider/verification/step-2", {
      timeout: 10000,
      failOnStatusCode: false,
    });
    cy.wait(2000);
  });

  // Helper function to fill step-1 form
  function fillStep1Form() {
    cy.url({ timeout: 10000 }).should("include", "/verification/step-1");
    cy.log("📝 Filling Verification Step-1 Form...");

    //Select gender
    cy.contains("Select gender").click();
    cy.get('[role="option"]').contains("Male").click();

    //Add DOB
    cy.get('input[name="dob"]').click().type("2003-02-23");

    //Add location
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

    //Add document number
    const docNumber = `${Date.now()}`.slice(-9);
    cy.get('input[placeholder="Enter document number"]').type(docNumber);

    //Upload documents
    cy.contains("label", "Citizenship Certificate - Front Side")
      .parent()
      .find('input[type="file"]')
      .attachFile("imgs/Australia.png");

    cy.contains("label", "Citizenship Certificate - Back Side")
      .parent()
      .find('input[type="file"]')
      .attachFile("imgs/Australia.png");

    cy.get('button[type="submit"]').should("be.visible").click();
    cy.wait(3000);

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("✅ Step-1 submitted successfully - now on Step-2");
  }

  // Step-2 tests start here
  it("BSP_013 - Should load step-2 page", () => {
    cy.log("Testing BSP_013: Step-2 page load");
    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.contains("Create your business profile").should("be.visible");

    cy.request({
      method: "POST",
      url: "https://qc.sewaverse.com/api/auth/updateToken",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;

      const userData = response.body.user;
      let reg_name = userData.name;

      cy.contains(reg_name).should("be.visible");
    });

    cy.log("✅ Step-2 page loaded successfully");
  });

  it("BSP_014 - Should perform Mandaoty Field Validation", () => {
    cy.log("Testing BSP_014: Mandatory Field Validation");

    cy.get('input[placeholder="Profession (Required*)"]').clear();
    cy.contains("button", "Experience (Required*)").should("be.visible");
    cy.get('input[placeholder="Core Skills (Required*)"]').should("exist");

    cy.get('button[type="submit"]').click();

    cy.contains("Profession is required").should("be.visible");
    cy.contains("Experience is required").should("be.visible");
    cy.contains("At least one skill is required").should("be.visible");
  });

  it("BSP_015 - Should upload valid profile picture successfully", () => {
    cy.log("Testing BSP_015: Upload valid profile picture");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    cy.contains("p", "Click to upload or take a picture").click();
    cy.contains("p", "Upload from Device").click();

    //Before upload check if file is empty
    cy.get('input[type="file"]').then(($input) => {
      expect($input[0].files.length).to.equal(0);
      cy.log("✓ File input is empty");
    });

    cy.get('input[type="file"]').attachFile("imgs/profile.png");

    // Check file is attached BEFORE clicking Save
    cy.get('input[type="file"]').then(($input) => {
      expect($input[0].files.length).to.equal(1);
      expect($input[0].files[0].name).to.equal("profile.png");
      cy.log(`✅ File attached: ${$input[0].files[0].name}`);
    });

    cy.contains('button[type="submit"]', "Save Profile Picture").click();

    // After modal closes - verify image preview in main page
    cy.get("body").then(($body) => {
      const hasImagePreview =
        $body.find('img[src*="blob:"]').length > 0 ||
        $body.find('img[src*="data:image"]').length > 0;

      const uploadTextGone = !$body
        .text()
        .includes("Click to upload or take a picture");

      if (hasImagePreview || uploadTextGone) {
        cy.log("✅ TEST PASSED: Profile picture uploaded and saved");
      } else {
        cy.log("❌ TEST FAILED: No image preview found after save");
      }
    });
  });

  it("BSP_016 - Should throw error for invalid profile picture", () => {
    cy.log("Testing BSP_016: Invalid Profile Picture Upload");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    cy.contains("p", "Click to upload or take a picture").click();

    //Before uploading a image
    cy.get('input[type = "file"]').then(($input) => {
      expect($input[0].files.length).to.equal(0);
      cy.log("✅ File input is empty");
    });

    cy.get('input[type="file"]').attachFile("imgs/Main.png");

    cy.get("body").then(($body) => {
      if ($body.text().includes("File is larger than 5242880 bytes")) {
        cy.log("✅ TEST PASSED: Large files successfully blocked ");
      } else {
        cy.log("❌ TEST FAILED: Large files uploaded ");
      }
    });
    cy.contains('button[type="submit"]', "Save Profile Picture").click();
  });

  it("BSP_017 - Should change existing profile picture", () => {
    cy.log("Testing BSP_017: Change existing profile picture");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    //Upload one image first
    cy.contains("p", "Click to upload or take a picture").click();
    cy.contains("p", "Upload from Device").click();
    cy.get('input[type="file"]').attachFile("imgs/Australia.png");
    cy.contains('button[type="submit"]', "Save Profile Picture").click();

    //Change to another image
    cy.contains('button[type="button"]', "Change Picture").click();

    cy.contains("p", "Upload from Device").click();
    cy.get('input[type="file"]').attachFile("imgs/profile.png");

    //Check if image is changed
    cy.get('input[type="file"]').then(($input) => {
      expect($input[0].files.length).to.equal(1);
      expect($input[0].files[0].name).to.equal("profile.png");
    });

    cy.contains('button[type="submit"]', "Save Profile Picture").click();

    // After modal closes - verify image preview in main page
    cy.get("body").then(($body) => {
      const hasImagePreview =
        $body.find('img[src*="blob:"]').length > 0 ||
        $body.find('img[src*="data:image"]').length > 0;

      const uploadTextGone = !$body
        .text()
        .includes("Click to upload or take a picture");

      if (hasImagePreview || uploadTextGone) {
        cy.log("✅ TEST PASSED: Profile picture uploaded and saved");
      } else {
        cy.log("❌ TEST FAILED: No image preview found after save");
      }
    });
  });

  //   it("BSP_018 - Should open camera interface, take photo and upload it", () => {
  //     cy.log("Testing BSP_018: Open camera interface, take photo and upload it");

  //     cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
  //     cy.log("Page loaded successfully");

  //     cy.contains("p", "Click to upload or take a picture").click();
  //     cy.contains("p", "Take Photo").click();
  //     cy.wait(20000);

  //     cy.contains('button[type="button"]', "Capture Photo").click();
  //   });

  it("BSP-019 Should accept valid profession input", () => {
    cy.log("Testing BSP-019: Should accept valid profession input");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    // Log all h1.gradient-text elements
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`h1[${index}]: ${$h1.text()}`);
    });

    cy.get('input[placeholder="Profession (Required*)"]').type("QA");

    //Check which h1 element changed
    // Log all h1 elements again to see which one changed
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`After typing - h1[${index}]: ${$h1.text()}`);
    });

    //Validate
    cy.get("h1.gradient-text").eq(1).should("contain", "QA");
  });

  it("BSP_020 - Should select experience from dropdown", () => {
    cy.log("BSP-020 - Experience Dropdown - Selection");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    // Log all h1.gradient-text elements
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`h1[${index}]: ${$h1.text()}`);
    });

    cy.get('button[role="combobox"]').click();
    cy.contains('div[role="option"]', "3 years").click();

    //Check which h1 element changed
    // Log all h1 elements again to see which one changed
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`After selecting - h1[${index}]: ${$h1.text()}`);
    });

    //Validate
    cy.get("h1.gradient-text").eq(2).should("contain", "3 years");
  });

  it("BSP-021 Should select existing services in offered service type", () => {
    cy.log("Testing BSP-021:  Offered Service Types - Add Service");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    // Log all h1.gradient-text elements
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`h1[${index}]: ${$h1.text()}`);
    });

    //First Category
    cy.contains("div", "Add Sewa").click();
    cy.contains("Choose Your Service Types").should("be.visible");
    cy.contains("button", "Auto Repair & Maintenance").click();
    cy.contains("E - Vehicles Repair & Maintenance")
      .parent()
      .find('button[role="checkbox"]')
      .click()
      .should("have.attr", "data-state", "checked");
    cy.contains("categories selected").find("span").should("contain", "1");
    cy.contains("button", "Save Selection").click();

    //Second Category
    cy.contains("div", "Add Sewa").click();
    cy.contains("Choose Your Service Types").should("be.visible");
    cy.contains("button", "Branding and Advertising").click();
    cy.contains("Content Creation & SEO Optimization")
      .parent()
      .find('button[role="checkbox"]')
      .click()
      .should("have.attr", "data-state", "checked");

    cy.contains("categories selected").find("span").should("contain", "2");
    cy.contains("button", "Save Selection").click();

    //Check which h1 element changed
    // Log all h1 elements again to see which one changed
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`After selecting - h1[${index}]: ${$h1.text()}`);
    });

    //Validate
    cy.get("h1.gradient-text")
      .eq(3)
      .should(
        "contain",
        "E - Vehicles Repair & Maintenance, Content Creation & SEO Optimization"
      );
  });

  it("BSP-023 Should select exisiting product in offered services type", () => {
    cy.log("Testing BSP-023:  Offered Service Types - Adding Product");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    // Log all h1.gradient-text elements
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`h1[${index}]: ${$h1.text()}`);
    });

    cy.contains("div", "Add Sewa").click();
    cy.contains("button", "Product").click();
    cy.contains("button", "Jewelry & Accessories").click();
    cy.contains("Jewelry (Gold-plated, Artificial)")
      .parent()
      .find('button[role="checkbox"]')
      .click()
      .should("have.attr", "data-state", "checked");
    cy.contains("categories selected").find("span").should("contain", "1");
    cy.contains("button", "Save Selection").click();

    cy.contains("div", "Add Sewa").click();
    cy.contains("button", "Product").click();
    cy.contains("button", "Food & Grocery").click();
    cy.contains("Beverages")
      .parent()
      .find('button[role="checkbox"]')
      .click()
      .should("have.attr", "data-state", "checked");
    cy.contains("categories selected").find("span").should("contain", "2");
    cy.contains("button", "Save Selection").click();

    //Check which h1 element changed
    // Log all h1 elements again to see which one changed
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`After selecting - h1[${index}]: ${$h1.text()}`);
    });

    //Validate
    cy.get("h1.gradient-text")
      .eq(3)
      .should("contain", "Jewelry (Gold-plated, Artificial), Beverages");
  });

  it("BSP-024 Should add new services in offered service type", () => {
    cy.log("Testing BSP-024:  Offered Service Types - Adding New Services");

    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("Page loaded successfully");

    // Log all h1.gradient-text elements
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`h1[${index}]: ${$h1.text()}`);
    });

    cy.contains("div", "Add Sewa").click();
    cy.contains("button", "Add New").click();
    cy.contains("Add New Service Category").should("be.visible");
    cy.get('input[placeholder="Service category name"]').type("Design");
    cy.get('input[placeholder="First service subcategory (optional)"]').type(
      "Web Design"
    );
    cy.contains("button", "Add Category").click();
    cy.contains("button", "Save Selection").click();

    //Check which h1 element changed
    // Log all h1 elements again to see which one changed
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`After selecting - h1[${index}]: ${$h1.text()}`);
    });

    // Log all h1.gradient-text elements
    cy.get("h1.gradient-text").each(($h1, index) => {
      cy.log(`h1[${index}]: ${$h1.text()}`);
    });

    //Validate
    cy.get("h1.gradient-text").eq(3).should("contain", "Web Design");
  });
});
