const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

/**
 * Middleware to authenticate requests using JWT Bearer token.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    // Attach user context to the request
    req.user = user;
    next();
  } catch (err) {
    let message = 'Invalid or expired authentication token.';
    if (err.name === 'TokenExpiredError') {
      message = 'Authentication token expired.';
    }
    return res.status(401).json({
      success: false,
      message,
    });
  }
}

/**
 * Middleware factory to restrict routes to specific user roles.
 * @param {string[]} roles Array of allowed roles
 */
function authorise(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.',
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware.
 * If a valid JWT Bearer token is provided, sets req.user.
 * Does not block the request if token is missing.
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired.',
      });
    }
    next();
  }
}

module.exports = {
  authenticate,
  authorise,
  optionalAuthenticate,
};
