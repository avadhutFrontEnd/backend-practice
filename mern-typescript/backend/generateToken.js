const jwt = require('jsonwebtoken');
require('dotenv').config();

const user = {
  id: '684e67b2be0a32e4164df13a', // Replace with your user's _id
  email: 'john@example.com' // Replace with your user's email
};

const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Generated JWT:', token);