const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === 'your_jwt_secret_key_here' || secret === 'your_secret_key') {
    throw new Error('JWT_SECRET must be set to a strong secret in backend/.env');
  }

  return secret;
};

const validateJwtConfig = () => {
  getJwtSecret();
};

/**
 * Generate a JWT token with user ID payload
 * @param {string} id - User ObjectId string
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id: id.toString() }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * Verify a given JWT token string
 * @param {string} token - JWT Bearer token
 * @returns {Object} Decoded payload object
 */
const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken,
  validateJwtConfig,
};