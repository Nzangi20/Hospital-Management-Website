// backend/middleware/auth.js
// Provides JWT authentication and role-based authorization helpers

const jwt = require('jsonwebtoken');

/**
 * Authenticate requests using Bearer token.
 * Adds `req.user = { userId, email, role, roleName }` on success.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    const role = decoded.role;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role,
      // Some controllers expect `roleName`, so keep both for compatibility
      roleName: role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Authorize based on one or more allowed roles.
 * Usage: authorize('Admin') or authorize('Admin', 'Doctor')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};