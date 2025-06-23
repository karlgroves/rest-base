/**
 * Secure Defaults Configuration
 *
 * Provides secure default configurations for all project components
 * to ensure security best practices are applied by default.
 *
 * @module secure-defaults
 * @author REST-Base Team
 */

/**
 * Secure defaults for Express.js applications
 */
const expressDefaults = {
  // Security middleware configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // CORS configuration
  cors: {
    origin: false, // Disable CORS by default, must be explicitly configured
    credentials: false,
    optionsSuccessStatus: 200,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Session configuration
  session: {
    secret: null, // Must be set by application
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    },
  },

  // Body parser limits
  bodyParser: {
    json: { limit: "10mb" },
    urlencoded: { limit: "10mb", extended: false },
  },
};

/**
 * Secure defaults for database connections
 */
const databaseDefaults = {
  // MySQL/MariaDB defaults
  mysql: {
    host: "localhost",
    port: 3306,
    ssl: {
      rejectUnauthorized: true,
    },
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: "utf8mb4",
  },

  // Sequelize ORM defaults
  sequelize: {
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false, // Disable SQL logging in production
    define: {
      timestamps: true,
      paranoid: true, // Enable soft deletes
      underscored: true,
      freezeTableName: true,
    },
  },
};

/**
 * Secure defaults for logging
 */
const loggingDefaults = {
  bunyan: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    name: "rest-base",
    streams: [
      {
        level: "info",
        stream: process.stdout,
      },
      {
        level: "error",
        path: "logs/error.log",
      },
      {
        level: "info",
        path: "logs/combined.log",
      },
    ],
  },
};

/**
 * Secure defaults for authentication and authorization
 */
const authDefaults = {
  jwt: {
    algorithm: "HS256",
    expiresIn: "1h",
    issuer: "rest-base",
    audience: "rest-base-client",
  },

  bcrypt: {
    rounds: 12, // Strong hashing rounds
  },

  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  },
};

/**
 * Secure defaults for file operations
 */
const fileDefaults = {
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/json",
    ],
    destination: "./uploads/",
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 5,
    },
  },

  paths: {
    allowedDirectories: ["./uploads/", "./temp/", "./public/"],
    forbiddenDirectories: ["./node_modules/", "./.git/", "./config/"],
  },
};

/**
 * Secure defaults for API responses
 */
const apiDefaults = {
  response: {
    removeStackTrace: process.env.NODE_ENV === "production",
    maxResponseSize: 10 * 1024 * 1024, // 10MB
    defaultHeaders: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },

  validation: {
    stripUnknown: true,
    abortEarly: false,
    allowUnknown: false,
  },
};

/**
 * Environment-specific overrides
 */
const environmentDefaults = {
  development: {
    logging: {
      level: "debug",
    },
    database: {
      logging: console.log,
    },
  },

  test: {
    logging: {
      level: "error",
    },
    database: {
      logging: false,
    },
  },

  production: {
    logging: {
      level: "info",
    },
    session: {
      cookie: {
        secure: true,
      },
    },
  },
};

/**
 * Get secure defaults for a specific component
 * @param {string} component - Component name (express, database, logging, etc.)
 * @param {string} environment - Environment (development, test, production)
 * @returns {Object} Secure defaults configuration
 */
function getSecureDefaults(
  component,
  environment = process.env.NODE_ENV || "development",
) {
  const defaults = {
    express: expressDefaults,
    database: databaseDefaults,
    logging: loggingDefaults,
    auth: authDefaults,
    file: fileDefaults,
    api: apiDefaults,
  };

  let config = defaults[component] || {};

  // Apply environment-specific overrides
  if (
    environmentDefaults[environment] &&
    environmentDefaults[environment][component]
  ) {
    config = mergeDeep(config, environmentDefaults[environment][component]);
  }

  return config;
}

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function mergeDeep(target, source) {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

/**
 * Check if value is an object
 * @param {*} item - Item to check
 * @returns {boolean} True if item is an object
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Validate configuration against secure defaults
 * @param {Object} config - Configuration to validate
 * @param {string} component - Component type
 * @returns {Object} Validation result
 */
function validateConfiguration(config, component) {
  const defaults = getSecureDefaults(component);
  const issues = [];

  // Check for missing critical security settings
  if (component === "express") {
    if (!config.helmet) {
      issues.push("Missing Helmet security middleware configuration");
    }
    if (!config.rateLimit) {
      issues.push("Missing rate limiting configuration");
    }
  }

  if (component === "database") {
    if (!config.ssl) {
      issues.push("SSL not configured for database connection");
    }
  }

  if (component === "auth") {
    if (!config.jwt || !config.jwt.secret) {
      issues.push("JWT secret not configured");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    defaults,
  };
}

module.exports = {
  getSecureDefaults,
  validateConfiguration,
  expressDefaults,
  databaseDefaults,
  loggingDefaults,
  authDefaults,
  fileDefaults,
  apiDefaults,
  environmentDefaults,
};
