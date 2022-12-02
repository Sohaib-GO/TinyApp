const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const session = require("cookie-session");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const {
  lookupUserByEmail,
  generateRandomString,
  userLinks,
} = require("./helpers");

app.use(
  // middleware
  session({
    name: "session",
    keys: [""],
  })
);

app.use(methodOverride("_method")); // allows us to use PUT and DELETE methods

app.set("view engine", "ejs"); // set ejs as the view engine
app.use(express.urlencoded({ extended: true })); // parse the body of the request
app.use(express.static(__dirname + "/public")); // serve static files from the public folder (css, images, etc)

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

app.get("/NOTuser", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("NOTuser", templateVars);
});

app.get("/", (req, res) => {
  res.redirect("urls");
});


app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    // if user is not logged in
    res.redirect("/NOTuser");
  }

  if (req.session.user_id) {
    // a user can only see their own urls
    let user = req.session.user_id;

    let templateVars = {
      urls: userLinks(user, urlDatabase),
      user: users[req.session.user_id],
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

app.get("/urls/:id", (req, res) => {
  // :id is a placeholder for the shortURL
  if (!req.session.user_id) {
    res.redirect("/NOTuser");
  }
  // handle the case where the shortURL is not in the database
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
  // create a new shortURL
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  }

  res.status(403).redirect("/NOTuser");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.delete("/urls/:id", (req, res) => {
  // delete a URL that belongs to the user
  if (req.session.user_id) {
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
      // check if the user is the owner of the URL
      delete urlDatabase[req.params.id];

      res.redirect("/urls");
    }

    res.status(403).send("You are not the owner of this URL");
  }
  res.status(403).redirect("/NOTuser");
});

app.put("/urls/:id", (req, res) => {
  // update a URL that belongs to the user
  if (req.session.user_id) {
    // if the user is logged in
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
      // if the user is the owner of the URL
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect("/urls");
    }

    res.status(403).send("You are not the owner of this URL");
  } else {
    res.status(403).redirect("/NOTuser");
  }
});

app.get("/register", (req, res) => {
  // registration page
  if (req.session.user_id) {
    res.redirect("/urls");
  }

  res.render("register");
});

app.post("/register", (req, res) => {
  // register a new user
  const email = req.body.email;
  const password = req.body.password;
  const user = lookupUserByEmail(email, users);
  const hashedPassword = bcrypt.hashSync(password);

  if (!email || !password) {
    res.status(400).send("Please enter an email and password");
  }

  if (user) {
    res.status(400).send("Email already exists");
  }

  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: hashedPassword,
  };

  req.session.user_id = id;
  res.redirect("/urls");
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
  const user = lookupUserByEmail(email, users);
  const hashedPassword = bcrypt.hashSync(password);

  if (user && bcrypt.compareSync(password, hashedPassword)) {
    // if the user exists and the password matches
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
  if (!user) {
    res.status(403).send(`${email} does not exist`);
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
