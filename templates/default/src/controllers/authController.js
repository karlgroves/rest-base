/**
 * Authentication Controller
 *
 * Authentication endpoints for {{projectName}}
 * @author {{author}}
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ValidationError, UnauthorizedError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = userId => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

/**
 * Register new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new ValidationError('User with this email already exists'));
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Generate token
    const token = generateToken(user.id);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new UnauthorizedError('Invalid email or password'));
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return next(new UnauthorizedError('Invalid email or password'));
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new UnauthorizedError('User not found'));
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
