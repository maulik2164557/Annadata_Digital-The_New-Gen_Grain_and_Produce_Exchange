const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token with user ID payload
 * @param {string} id - User ObjectId string
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * Verify a given JWT token string
 * @param {string} token - JWT Bearer token
 * @returns {Object} Decoded payload object
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};