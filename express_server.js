const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const PORT = 8080;
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');

const getUserByEmail = require('./helper');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'user_id',
  keys: ['key1', 'key2']
}));

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

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
};

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

app.get('/register', (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { user_id: users[user_id] };
  res.render('registration', templateVars);
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    res.send("Error 400: Email/Password not submitted");
  }
  if  (getUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    res.send("Error 400: Email already has a user");
  }
  let id = generateRandomString();
  users[id] = {};
  users[id].id = id;
  users[id].email = req.body.email;
  users[id].password = bcrypt.hashSync(req.body.password, 10);
  req.session.user_id = id;
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  let user_id = req.session.user_id;
  let list = urlsForUser(user_id);
  let templateVars = {
    urls: list,
    user_id: users[user_id]
  };
  res.render('url_index', templateVars);
});

app.post('/urls', (req, res) => {
  let longURL = req.body.longURL;
  if (!longURL.startsWith('http://') && !longURL.startsWith('https://')) {
    longURL = "http://" + longURL;
  }
  let short = generateRandomString();
  urlDatabase[short] = {};
  urlDatabase[short].longURL = longURL;
  urlDatabase[short].userID = req.session.user_id;
  let newURL = `/urls/${short}`;
  res.redirect(newURL);
});

app.get('/urls/new', (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { user_id: users[user_id] };
  if (users[user_id]) {
    res.render('urls_new', templateVars);
  }
  res.redirect('/urls');
});

app.get("/urls/:shortURL", (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[user_id]
  };
  if (templateVars.longURL === undefined) {
    res.status(404);
    res.render("url_error");
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.redirect(templateVars.longURL);
});

app.get('/urls-json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = { user_id: users[user_id] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  if (getUserByEmail(req.body.email, users)) {
    if (bcrypt.compareSync(req.body.password, users[getUserByEmail(req.body.email, users)].password)) {
      req.session.user_id = getUserByEmail(req.body.email, users);
      res.redirect('/urls');
    } else {
      res.statusCode = 403;
      res.send('ERROR 403: Password does not match');
    }
  } else {
    res.statusCode = 403;
    res.send("ERROR 403: Account does not exist or you've left a field incomplete.");
  }
});

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});