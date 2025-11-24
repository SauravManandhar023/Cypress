Cypress.on("uncaught:exception", (err, runnable) => {
  if (
    err.message.includes("Minified React error #418") ||
    err.message.includes("Hydration")
  ) {
    return false;
  }
  return true;
});

describe("Sewa Provider Profile Page", () => {
  const testEmail = "jidade6133@okcdeals.com";

  beforeEach(() => {
    cy.viewport(1280, 1320);

    cy.session(
      `sewaProviderAccess-${testEmail}`,
      () => {
        //Visit Sewaverse page
        cy.visit("https://qc.sewaverse.com");
        cy.wait(2000);
        cy.log("Homepage Loaded");

        //Visit Login page
        cy.contains("button", "Login").should("be.visible").click();
        cy.url().should("eq", "https://qc.sewaverse.com/login");
        cy.log("Redirected to login page");

        //Login with valid credentials
        cy.get('input[name="email"]').should("be.visible").type(testEmail);
        cy.get('input[name="password"]').should("be.visible").type("Test@123");
        cy.get('button[type="submit"]').click();
        cy.wait(3000); // Increased wait time for login

        cy.url({ timeout: 10000 }).then((url) => {
          if (url.includes("/login")) {
            cy.log("❌ Login failed");
            throw new Error("Login failed - still on login page");
          } else if (url.includes("sewa-provider/welcome")) {
            cy.log("✅ User is already a sewa-provider");
            cy.contains("button", "Get Started").should("be.visible").click();
            cy.wait(2000);

            cy.url({ timeout: 10000 }).then((newUrl) => {
              if (newUrl.includes("verification/step-1")) {
                cy.log("User needs to fill the step-1 form");
                fillStep1Form();
                fillStep2Form(); // Step-1 function already navigates to step-2
              } else if (newUrl.includes("verification/step-2")) {
                cy.log("User has filled step-1 form, now on step-2");
                fillStep2Form();
              } else if (newUrl.includes("/profile")) {
                cy.log("User already on profile page");
              }
            });
          } else if (url.includes("/profile")) {
            cy.log("✅ User has already completed entire verification");
          } else if (
            url === "https://qc.sewaverse.com" ||
            url === "https://qc.sewaverse.com/"
          ) {
            cy.log("User is not a sewa-provider yet");

            cy.visit("https://qc.sewaverse.com/beasewaprovider");
            cy.wait(2000);

            cy.contains("button", "Become a Sewa Provider")
              .should("be.visible")
              .click();
            cy.wait(2000);

            cy.url().should("include", "sewa-provider/welcome");
            cy.contains("button", "Get Started").should("be.visible").click();
            cy.wait(2000);

            cy.url().should("include", "verification/step-1");
            fillStep1Form();
            fillStep2Form();
          } else {
            cy.log(`⚠️ Unexpected URL: ${url}`);
          }
        });

        //Ensure we're on profile page before ending session
        cy.url({ timeout: 10000 }).should("include", "/profile");
        cy.log("✅ Session setup complete - on Profile Page");
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

    // After session restoration, visit the profile page
    cy.visit("https://qc.sewaverse.com/profile", {
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

  //Helper function to fill Step2Form
  function fillStep2Form() {
    cy.url({ timeout: 10000 }).should("include", "/verification/step-2");
    cy.log("📝 Filling Verification Step-2 Form...");

    //1. Upload Profile Picture
    cy.contains("p", "Click to upload or take a picture").click();
    cy.wait(500);
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
      cy.log(`✓ File attached: ${$input[0].files[0].name}`);
    });

    cy.contains('button[type="submit"]', "Save Profile Picture").click();
    cy.wait(2000);

    // After modal closes - verify image preview in main page
    cy.get("body").then(($body) => {
      const hasImagePreview =
        $body.find('img[src*="blob:"]').length > 0 ||
        $body.find('img[src*="data:image"]').length > 0;

      const uploadTextGone = !$body
        .text()
        .includes("Click to upload or take a picture");

      if (hasImagePreview || uploadTextGone) {
        cy.log("✓ Profile picture uploaded and saved");
      } else {
        cy.log("⚠️ No image preview found after save");
      }
    });

    //2. Add Profession
    cy.get('input[placeholder="Profession (Required*)"]').clear().type("QA");
    cy.log("✓ Profession added");

    //3. Add Experience
    cy.get('button[role="combobox"]').click();
    cy.contains('div[role="option"]', "3 years").click();
    cy.log("✓ Experience added");

    //4. Add Offered Service Type
    //First Category
    cy.contains("div", "Add Sewa").click();
    cy.wait(500);
    cy.contains("Choose Your Service Types").should("be.visible");
    cy.contains("button", "Auto Repair & Maintenance").click();
    cy.wait(500);
    cy.contains("E - Vehicles Repair & Maintenance")
      .parent()
      .find('button[role="checkbox"]')
      .click()
      .should("have.attr", "data-state", "checked");
    cy.contains("categories selected").find("span").should("contain", "1");
    cy.contains("button", "Save Selection").click();
    cy.wait(1500);
    cy.log("✓ First service added");

    //Second Category
    cy.contains("div", "Add Sewa").click();
    cy.wait(500);
    cy.contains("Choose Your Service Types").should("be.visible");
    cy.contains("button", "Branding and Advertising").click();
    cy.wait(500);
    cy.contains("Content Creation & SEO Optimization")
      .parent()
      .find('button[role="checkbox"]')
      .click()
      .should("have.attr", "data-state", "checked");

    cy.contains("categories selected").find("span").should("contain", "2");
    cy.contains("button", "Save Selection").click();
    cy.wait(1500);
    cy.log("✓ Second service added");

    //5. Add Core Skills

    // Log all span.gradient-text elements
    cy.get("span.gradient-text").each(($span, index) => {
      cy.log(`span[${index}]: ${$span.text()}`);
    });

    cy.get('input[placeholder="Core Skills (Required*)"]').type("QA");
    cy.get(".lucide-plus").parent().click();
    cy.wait(300);

    cy.get('input[placeholder="Core Skills (Required*)"]').type("Designer");
    cy.get(".lucide-plus").parent().click();
    cy.wait(300);

    cy.get('input[placeholder="Core Skills (Required*)"]').type("Developer");
    cy.get(".lucide-plus").parent().click();
    cy.wait(300);

    cy.get('input[placeholder="Core Skills (Required*)"]').type("Manager");
    cy.get(".lucide-plus").parent().click();
    cy.wait(300);

    cy.log("✓ Core skills added");

    //Validate core skills
    cy.get("span.gradient-text").eq(3).should("contain", "QA");
    cy.get("span.gradient-text").eq(4).should("contain", "Designer");
    cy.get("span.gradient-text").eq(5).should("contain", "Developer");
    cy.get("span.gradient-text").eq(6).should("contain", "Manager");

    //6. Add Location
    cy.contains("div", "Add Location").click();
    cy.wait(500);
    cy.contains("Location of Service").should("be.visible");

    cy.contains("div", "All over Nepal")
      .parent()
      .find('button[role="checkbox"]')
      .click();

    cy.contains("button", "Save Location").click();
    cy.wait(1500);
    cy.log("✓ Location added");

    //Validate all fields in profile preview
    cy.get("h1.gradient-text").eq(1).should("contain", "QA");
    cy.get("h1.gradient-text").eq(2).should("contain", "3 years");
    cy.get("h1.gradient-text")
      .eq(3)
      .should(
        "contain",
        "E - Vehicles Repair & Maintenance, Content Creation & SEO Optimization"
      );
    cy.get("h1.gradient-text").eq(4).should("contain", "All over Nepal");

    cy.log("✓ All fields validated");

    // IMPORTANT: Submit the form to go to profile page
    cy.contains("button", "Proceed").should("be.visible").click();
    cy.wait(3000);

    cy.url({ timeout: 10000 }).should("include", "/profile");
    cy.log("✅ Step-2 submitted successfully - now on Profile Page");
  }

  // Profile Page Test Starts from here

  it("PP_001 - Should load the profile page", () => {
    cy.url().should("eq", "https://qc.sewaverse.com/profile");
    cy.log("Url matched");

    cy.get(".bg-white.shadow-lg.rounded-3xl").should("be.visible");
    cy.log("Profile card visible");

    cy.get("#about-me").should("be.visible");
    cy.log("About Me section visible");

    cy.get("#experience").should("be.visible");
    cy.log("Experience section visible");

    cy.get("#licenses").should("be.visible");
    cy.log("Licenses section visible");

    cy.get("#awards-achievements").should("be.visible");
    cy.log("Awards & Achievements section visible");

    cy.get("#my-works").should("be.visible");
    cy.log("My Works section visible");

    cy.get("#ratings-reviews").should("be.visible");
    cy.log("Ratings & Reviews section visible");

    cy.get("#offered-services").should("be.visible");
    cy.log("Offered Services section visible");

    cy.get("footer").should("be.visible");

    cy.log("✅ Profile page loaded successfully");
  });

  it("PP_002: Should verify that profile header displays correct information", () => {
    cy.request({
      method: "GET",
      url: "https://qc.sewaverse.com/api/service-provider/profile",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;

      //1.Check Name
      const userData = response.body.serviceProvider;
      cy.get("h2.truncate").should("contain", userData.name);
      cy.log("Profile Name displayed correctly");

      //2.Check Joined Date
      const apiDate = userData.createdAt;
      const date = new Date(apiDate);
      const options = { year: "numeric", month: "long", day: "numeric" };
      const expectedDate = date.toLocaleDateString("en-Us", options);

      cy.contains("Joined on: ").should("contain", expectedDate);
      cy.log("Joined date displayed correctly");

      //4.Check Service Delivered
      cy.contains("No Services Delivered Yet").should("be.visible");
      cy.log("Service Delivered displayed correctly");

      // Log all span.gradient-text elements
      cy.get("span.gradient-text").each(($span, index) => {
        cy.log(`span[${index}]: ${$span.text()}`);
      });

      //4. Check Profession
      const profileCard = response.body.serviceProvider.profile;
      cy.get("span.gradient-text")
        .eq(0)
        .should("contain", profileCard.profession);
      cy.log("Profession displayed correctly");

      //5. Check Experience
      cy.get("span.gradient-text")
        .eq(1)
        .should("contain", profileCard.experience);
      cy.log("Experience displayed correctly");

      //6. Check Rating
      cy.get("p.text-sm.sm\\:text-base.ml-1").should(
        "contain",
        profileCard.overallRating
      );
      cy.log("Rating displayed correctly");

      //7. Check Offered Service Types
      const userServices = response.body.serviceProvider.serviceCategories;

      if (userServices.length > 0) {
        cy.get("span.gradient-text")
          .eq(2)
          .should("contain", userServices[0].name);
        cy.log(
          `First service category "${userServices[0].name}" displayed correctly`
        );
        cy.get("span.gradient-text")
          .eq(3)
          .should("contain", userServices[2].name);
        cy.log(
          `Second service category "${userServices[2].name}" displayed correctly`
        );
      } else {
        cy.log("No service categories found");
      }

      //8. Check Locatioon of service
      const userLocation = response.body.serviceProvider.locations[0];

      if (userLocation.allOverNepal) {
        cy.contains("p.gradient-text", "All over Nepal").should("be.visible");
        cy.log("Location: All over Nepal displayed correctly");
      } else if (userLocation.district) {
        cy.contains("p.gradient-text", userLocation.district).should(
          "be.visible"
        );
        cy.log(`Location: ${userLocation.district} displayed correctly`);
      } else if (userLocation.radius) {
        cy.contains("p.gradient-text", userLocation.radius).should(
          "be.visible"
        );
        cy.log(`Location: ${userLocation.radius} displayed correctly`);
      }

      //9. Check Core Skills
      cy.get("span.gradient-text")
        .eq(4)
        .should("contain", profileCard.skills[0]);

      cy.get("span.gradient-text")
        .eq(5)
        .should("contain", profileCard.skills[1]);

      cy.get("span.gradient-text")
        .eq(6)
        .should("contain", profileCard.skills[2]);

      cy.get("span.gradient-text")
        .eq(7)
        .should("contain", profileCard.skills[3]);
    });

    cy.log("✅ Profile header displayed correctly");
  });
});
