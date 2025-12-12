const bcrypt = require('bcrypt');

bcrypt.hash("12345", 10).then(hash => {
  console.log("HASH: ", hash);
}).catch(err => {
  console.error(err);
});
