/**
 * Database Configuration
 *
 * Sequelize configuration for different environments
 * @author {{author}}
 */

require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '{{projectName}}_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // eslint-disable-line no-console
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || '{{projectName}}_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false
            }
          : false
    }
  }
};

module.exports = config;
