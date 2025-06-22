/**
 * @fileoverview Configuration management for API Gateway
 * @module config
 * @requires dotenv
 * @requires joi
 */

import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

/**
 * Configuration schema validation
 */
const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(8080),
  REDIS_URL: Joi.string()
    .uri()
    .default('redis://localhost:6379'),
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key for token verification'),
  JWT_ISSUER: Joi.string()
    .default('{{projectName}}'),
  JWT_AUDIENCE: Joi.string()
    .default('{{projectName}}-users'),
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000'),
  TRUST_PROXY: Joi.boolean()
    .default(false),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100),
  BODY_PARSER_JSON_LIMIT: Joi.string()
    .default('1mb'),
  BODY_PARSER_URLENCODED_LIMIT: Joi.string()
    .default('1mb'),
}).unknown(true);

/**
 * Validate and extract configuration
 */
const { error, value: envVars } = configSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

/**
 * Configuration object
 * @type {Object}
 */
const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  redis: {
    url: envVars.REDIS_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    issuer: envVars.JWT_ISSUER,
    audience: envVars.JWT_AUDIENCE,
    algorithms: ['HS256'],
  },
  cors: {
    origins: envVars.CORS_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
  },
  trustProxy: envVars.TRUST_PROXY,
  logging: {
    level: envVars.LOG_LEVEL,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  bodyParser: {
    jsonLimit: envVars.BODY_PARSER_JSON_LIMIT,
    urlencodedLimit: envVars.BODY_PARSER_URLENCODED_LIMIT,
  },
};

export default config;