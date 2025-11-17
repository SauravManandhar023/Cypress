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
