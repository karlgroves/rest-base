/**
 * Authentication Middleware
 *
 * JWT authentication middleware for {{projectName}}
 * @author {{author}}
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { UnauthorizedError } = require('./errorHandler');

/**
 * Authenticate JWT token
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next(new UnauthorizedError('Access denied. No token provided.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return next(new UnauthorizedError('Invalid token or user not active.'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired.'));
    }
    next(error);
  }
};

module.exports = auth;
