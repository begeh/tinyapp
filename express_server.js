const express = require('express');
const app = express();
const PORT = 8080; //default port 8080

const urlDatabase = {
  'bzxVn2': 'http://www.lighthouse.ca',
  '9sm5xk': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});