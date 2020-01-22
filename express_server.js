const express = require('express');
const app = express();
const PORT = 8080; //default port 8080
var cookieParser = require('cookie-parser')

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');

const urlDatabase = {
  'bzxVn2': 'http://www.lighthouselabs.ca',
  '9sm5xk': 'http://www.google.com'
};

function generateRandomString() {
  return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
}

app.post('/urls', (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  let newURL = `/urls/${short}`;
  res.redirect(newURL);
});

app.get('/urls/new', (req, res) => {
  let templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render('url_index', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['username']
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
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout',(req, res) =>{
  res.clearCookie('username',{path:'/'});
  res.redirect('/urls');
});

app.listen(PORT, () => {
   console.log(`Example app listening on port ${PORT}!`);
});