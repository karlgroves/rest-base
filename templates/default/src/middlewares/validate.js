/**
 * Validation Middleware
 *
 * Express-validator middleware for {{projectName}}
 * @author {{author}}
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new ValidationError(errorMessages.join(', ')));
  }

  next();
};

module.exports = validate;
