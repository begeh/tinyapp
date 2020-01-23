const getUserByEmail = (email, database) => {
  for(let key in database){
    if(database[key].email === email){
      return key;
    }
  }
};

module.exports = getUserByEmail;