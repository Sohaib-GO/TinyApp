const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const session = require('cookie-session');
const bcrypt = require("bcryptjs");

app.use(session({
  name: 'session',
  keys: [''],
}));



app.set("view engine", "ejs"); // set ejs as the view engine
app.use(express.urlencoded({ extended: true })); // parse the body of the request
app.use(express.static(__dirname + "/public")); // serve static files from the public folder

// const urlDatabase = {
//   b2xVn2: "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
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

const lookupUserByEmail = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

const userLinks = (id) => {
  // returns an object of links for a specific user
  let userLinks = {};
  for (let link in urlDatabase) {
    if (urlDatabase[link].userID === id) {
      userLinks[link] = urlDatabase[link];
    }
  }
  return userLinks;
};

app.get("/NOTuser", (req, res) => {
  const templateVars = {
    user : users[req.session.user_id]
  };
  res.render("NOTuser", templateVars);
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/NOTuser");
  }
  // a user can only see their own links and not others

  if (req.session.user_id) {
    let templateVars = {
      urls: userLinks(req.session.user_id),
      user: users[req.session.user_id],
    };
    res.render("urls_index", templateVars);
  }
});

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

app.get("/urls/:id", (req, res) => {
  // :id is a placeholder for the shortURL
  // handle the case where the shortURL is not in the database
  if (!req.session.user_id) {
    res.redirect("/NOTuser");
  }

  if (!urlDatabase[req.params.id]) {
    res.status(404).send("URL not found");
  }

  const templateVars = {
    // templateVars is an object that will be passed to the template
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  }

  res.status(403).redirect("/NOTuser");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  // delete a URL that belongs to the user
  if (req.session.user_id) {
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
      delete urlDatabase[req.params.id];

      res.redirect("/urls");
    }

    res.status(403).send("You are not the owner of this URL");
  }
  res.status(403).redirect("/NOTuser");
});

app.post("/urls/:id", (req, res) => {
  // update a URL that belongs to the user
  if (req.session.user_id) {
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect("/urls");
    }

    res.status(403).send("You are not the owner of this URL");
  } else {
    res.status(403).redirect("/NOTuser");
  }
});

app.get("/register", (req, res) => {
  // register page
  if (req.session.user_id) {
    res.redirect("/urls");
  }

  res.render("register");
});

app.post("/register", (req, res) => {
  // register a new user
  const email = req.body.email;
  const password = req.body.password;
  const user = lookupUserByEmail(email);
  const hashedPassword = bcrypt.hashSync(password);

  if (email === "" || hashedPassword === "") {
    res.status(400).send("Please enter an email and password");
    return;
  } else if (user) {
    res.status(400).send("Email already exists");
    return;
  } else {
    const id = generateRandomString();
    users[id] = { id, email, hashedPassword };
    req.session.user_id = id;
    res.redirect("/urls");
    
  }
});

app.get("/login", (req, res) => {
  // login page
  // if user is logged in, redirect to /urls
  if (req.session.user_id) {
    res.redirect("/urls");
  }

  res.render("login");
});

app.post("/login", (req, res) => {
  // login a user
  const email = req.body.email;
  const password = req.body.password;
  const user = lookupUserByEmail(email);
  const hashedPassword = bcrypt.hashSync(password);

  if (user && bcrypt.compareSync(password, hashedPassword)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid email or password");
  }
});

app.get("/logout", (req, res) => {
  // logout a user
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  // start the server
  console.log(`Example app listening on port ${PORT}!`);
});
