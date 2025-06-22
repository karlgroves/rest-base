/**
 * @fileoverview API Gateway main server file
 * @module gateway
 * @requires express
 * @requires ./config/index.js
 * @requires ./middleware/index.js
 * @requires ./routes/index.js
 * @requires ./utils/logger.js
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import config from './config/index.js';
import { setupMiddleware } from './middleware/index.js';
import { setupRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { connectRedis } from './services/redis.js';
import { gracefulShutdown } from './utils/shutdown.js';

/**
 * Initialize Express application
 * @returns {express.Application} Express application instance
 */
function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    optionsSuccessStatus: 200,
  }));

  // Compression middleware
  app.use(compression());

  // Request logging
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));

  // Body parsing middleware
  app.use(express.json({ limit: config.bodyParser.jsonLimit }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: config.bodyParser.urlencodedLimit 
  }));

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', config.trustProxy);

  return app;
}

/**
 * Start the API Gateway server
 * @async
 * @returns {Promise<void>}
 */
async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connection established');

    // Create Express app
    const app = createApp();

    // Setup custom middleware
    await setupMiddleware(app);

    // Setup routes
    setupRoutes(app);

    // Global error handler (must be last)
    app.use(errorHandler);

    // Create HTTP server
    const server = createServer(app);

    // Start listening
    server.listen(config.port, () => {
      logger.info(`{{projectName}} API Gateway running on port ${config.port} in ${config.env} mode`);
      logger.info(`Health check available at: http://localhost:${config.port}/health`);
    });

    // Setup graceful shutdown
    gracefulShutdown(server);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default createApp;