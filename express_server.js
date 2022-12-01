const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs"); // set ejs as the view engine
app.use(express.urlencoded({ extended: true })); // parse the body of the request
app.use(express.static(__dirname + "/public")); // serve static files from the public folder

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

app.get("/urls/:id", (req, res) => {
  // handle the case where the shortURL is not in the database
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("URL not found");
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  }

  res.status(403).send("You must be logged in to create a new URL");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Delete a URL
app.post("/urls/:id/delete", (req, res) => {
  if (req.cookies["user_id"]) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
  res.status(403).send("You must be logged in to delete a URL");
});

// Update a URL
app.post("/urls/:id", (req, res) => {
  if (req.cookies["user_id"]) {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).send("You must be logged in to update a URL");
  }
});

// handle register
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }

  res.render("register");
});

// handle register post
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = lookupUserByEmail(email);

  if (email === "" || password === "") {
    res.status(400).send("Please enter an email and password");
    return;
  } else if (user) {
    res.status(400).send("Email already exists");
    return;
  } else {
    const id = generateRandomString();
    users[id] = { id, email, password };
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

// handle login
app.get("/login", (req, res) => {
  // if user is logged in, redirect to /urls
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }

  res.render("login");
});

// handle login post
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = lookupUserByEmail(email);

  if (user && user.password === password) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid email or password");
  }
});

// handle logout
app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
