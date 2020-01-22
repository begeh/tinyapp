const express = require('express');
const app = express();
const PORT = 8080; //default port 8080
var cookieParser = require('cookie-parser')

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: 'aJ48lW'},
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

function generateRandomString() {
  return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
}

const validateUser = (email) => {
  let keys = Object.keys(users);
  for (item of keys) {
    if (users[item].email === email) {
      return item;
    }
  }
  return false;
}

const urlsForUser = (id) =>{
  let keys = Object.keys(urlDatabase);
  let obj ={};
  for(item of keys){
    if(urlDatabase[item].userID === id){
      obj[item] = urlDatabase[item];
    }
  }
  return obj;
};

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    res.send("Error 400: Email/Password not submitted");
  }
  if (validateUser(req.body.email)) {
    res.statusCode = 400;
    res.send("Error 400: Email already has a user");
  }
  let id = generateRandomString();
  users[id] = {};
  users[id].id = id;
  users[id].email = req.body.email;
  users[id].password = req.body.password;
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  let newURL = `/urls/${short}`;
  res.redirect(newURL);
});

app.get('/urls/new', (req, res) => {
  let user_id = req.cookies.user_id;
  let templateVars = { user_id: users[user_id] };
  if (users[user_id]) {
    res.render('urls_new', templateVars);
  }
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  let user_id = req.cookies.user_id;
  let newUrlList =  urlsForUser(user_id);
  let templateVars = {
    urls: newUrlList,
    user_id: users[user_id]
  };
  res.render('url_index', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let user_id = req.cookies.user_id;
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user_id: users[user_id]
  };
  if (templateVars.longURL === undefined) {
    res.status(404);
    res.render("url_error");
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.redirect(templateVars.longURL);
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls-json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if(urlDatabase.shortURL.userID === req.cookies['url_id']){
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  let user_id = req.cookies.user_id;
  let templateVars = { user_id: users[user_id] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  if (validateUser(req.body.email)) {
    if (req.body.password === users[validateUser(req.body.email)].password) {
      res.cookie('user_id', validateUser(req.body.email));
      res.redirect('/urls');
    } else {
      res.statusCode = 403;
      res.send('ERROR 403: Password does not match')
    }
  } else {
    res.statusCode = 403;
    res.send("ERROR 403: Account does not exist or you've left a field incomplete.");
  }

});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id', { path: '/' });
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let user_id = req.cookies.user_id;
  let templateVars = { user_id: users[user_id] };
  res.render('registration', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});