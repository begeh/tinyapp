const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const PORT = 8080;
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')

const { getUserByEmail } = require('./helper');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'user_id',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: 'lvxz8h' },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//Generates random string for shortURL key and user ID
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
};

//Filters through database and returns new object with only URLs attached to the user ID passed to the function
const urlsForUser = (id) => {
  let keys = Object.keys(urlDatabase);
  let obj = {};
  for (let item of keys) {
    if (urlDatabase[item].userID === id) {
      obj[item] = urlDatabase[item];
    }
  }
  return obj;
};

//Renders registration page
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  let templateVars = { user_id: users[req.session.user_id] };
  res.render('registration', templateVars);
});

//Creates new account from registration page
app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 403;
    res.send("<html><body><h1>ERROR 403: Incomplete credentials. Please re-enter.</h1></body></html>");
  }
  if (getUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    res.send('<html><body><h1>Error 400: Email already exists for a user.</h1></body></html>');
  }
  let id = generateRandomString();
  users[id] = {};
  users[id].id = id;
  users[id].email = req.body.email;
  users[id].password = bcrypt.hashSync(req.body.password, 10);
  req.session.user_id = id;
  res.redirect('/urls');
});

//Renders page for 'My URLS' for logged in user. Redirects otherwise
app.get('/urls', (req, res) => {
  let user_id = req.session.user_id;
  let list = urlsForUser(user_id);
  let templateVars = {
    urls: list,
    user_id: users[user_id]
  };
  res.render('url_index', templateVars);
});

//Creates a new URL from the 'Create New URL' (url_new) page and redirects to url_show to display the new URL pair
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 403;
    res.send('<html><body><h1>Error 403: You must login to access this page.</h1></body></html>');
  }
  let longURL = req.body.longURL;
  if (!longURL.startsWith('http://') && !longURL.startsWith('https://')) {
    longURL = "http://" + longURL;
  }
  let short = generateRandomString();
  urlDatabase[short] = {};
  urlDatabase[short].longURL = longURL;
  urlDatabase[short].userID = req.session.user_id;
  urlDatabase[short].date = Date();
  let newURL = `/urls/${short}`;
  res.redirect(newURL);
});

//Renders 'Create New URL' page or redirects to login if not logged in
app.get('/urls/new', (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { user_id: users[user_id] };
  if (users[user_id]) {
    res.render('urls_new', templateVars);
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//Renders new page for newly created URL key pair (url_show)
app.get("/urls/:shortURL", (req, res) => {
  let user_id = req.session.user_id;
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.statusCode = 404;
    res.send('<html><body><h1>Error 404: This URL does not exist</h1></body></html>');
  }
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[user_id]
  };
  if (!user_id) {
    res.statusCode = 403;
    res.send('<html><body><h1>Error 403: You must login to access this page.</h1></body></html>');
  }
  if (user_id && urlDatabase[req.params.shortURL].userID !== user_id) {
    res.statusCode = 403;
    res.send('<html><body><h1>Error 403: This URL does not belong to you.</h1></body></html>');
  }
  res.render("urls_show", templateVars);
});

//Redirects to webpage (longURL) associated with shortURL in the URL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.statusCode = 404;
    res.send('<html><body><h1>Error 404: This URL does not exist</h1></body></html>');
  }
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.redirect(templateVars.longURL);
});

//Redirects '/' to the login page
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//Deletes a URL from a person's list of urls
app.delete('/urls/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 404;
    res.send('<html><body><h1>Error 404: This URL does not exist</h1></body></html>');
  }
  if (!req.session.user_id) {
    res.statusCode = 403;
    res.send('<html><body><h1>Error 403: You must login to access this page.</h1></body></html>');
  }
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//Updates shortURL with new URL
app.put('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 403;
    res.send('<html><body><h1>Error 403: You must login to access this page.</h1></body></html>');
  }
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.statusCode = 403;
    res.send('<html><body><h1>Error 403: This URL does not belong to you.</h1></body></html>');
  }
  let longURL = req.body.longURL;
  if (!longURL.startsWith('http://') && !longURL.startsWith('https://')) {
    longURL = "http://" + longURL;
  }
  urlDatabase[req.params.shortURL].longURL = longURL;
  res.redirect('/urls');
});

//Renders login page
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  let user_id = req.session.user_id;
  let templateVars = { user_id: users[user_id] };
  res.render('login', templateVars);
});

//Logins in based on input on login page (returns appropriate response if invalid data entered)
app.post('/login', (req, res) => {
  if (getUserByEmail(req.body.email, users)) {
    if (bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email, users).password)) {
      req.session.user_id = getUserByEmail(req.body.email, users).id;
      res.redirect('/urls');
    } else if (req.body.password === '') {
      res.statusCode = 403;
      res.send("<html><body><h1>ERROR 403: Incomplete credentials. Please re-enter.</h1></body></html>");
    } else {
      res.statusCode = 403;
      res.send('<html><body><h1>ERROR 403: Password does not match</body></h1></html>');
    }
  } else if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 403;
    res.send("<html><body><h1>ERROR 403: Incomplete credentials. Please re-enter.</h1></body></html>");
  } else {
    res.statusCode = 404;
    res.send("<html><body><h1>ERROR 404: User not found.</h1></body></html>");
  }
});

//When Logout is clicked, destroys session and redirects to homepage
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});