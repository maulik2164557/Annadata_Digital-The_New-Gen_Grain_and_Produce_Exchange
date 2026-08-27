const User = require('../models/User');
const { verifyToken } = require('../config/jwt');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Clean up whitespace around Bearer prefix
      token = req.headers.authorization.split(' ')[1]?.trim();

      if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ success: false, message: 'Invalid token format' });
      }

      const decoded = verifyToken(token);

      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User account not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };