const lookupUserByEmail = (email, database) => {
  // lookup user by email in database
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};

const userLinks = (id, database) => {
  // returns an object of links for a specific user
  let userLinks = {};
  for (let link in database) {
    if (database[link].userID === id) {
      userLinks[link] = database[link];
    }
  }
  return userLinks;
};

const generateRandomString = () => {
  // generates a random string of 6 characters
  return Math.random().toString(36).substring(2, 8);
};

module.exports = { lookupUserByEmail, userLinks, generateRandomString };
