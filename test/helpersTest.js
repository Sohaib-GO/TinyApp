const { assert } = require("chai");

const { lookupUserByEmail } = require("../helpers.js");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

describe("getUserByEmail", () => {
  it("should return a user with valid email", () => {
    const user = lookupUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.equal(user.id, expectedUserID);
  });

  it("should return undefined if the email is not in the database", () => {
    const user = lookupUserByEmail("nonExisting@gmail.com", testUsers);
    const expectedOutput = undefined;

    // Write your assert statement here
    assert.equal(user, expectedOutput);
  });
});
