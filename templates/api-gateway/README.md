# {{projectName}}

{{description}}

## Overview

This API Gateway provides a centralized entry point for microservices architecture, offering features like rate limiting, authentication, request routing, and service discovery. Built with Node.js and Express, it follows REST-SPEC standards for maintainable and scalable API development.

## Features

* **🔐 JWT Authentication**: Secure token-based authentication with role-based access control
* **⚡ Rate Limiting**: Redis-backed rate limiting with customizable rules per endpoint
* **🔀 Service Proxy**: Dynamic service discovery and intelligent request routing
* **📊 Health Monitoring**: Comprehensive health checks for gateway and downstream services
* **Security**: Built-in security headers, CORS support, and request validation
* **📈 Logging**: Structured logging with Bunyan for monitoring and debugging
* **🐳 Docker Ready**: Full containerization support with Docker Compose
* **🧪 Tested**: Comprehensive test suite with Jest and Supertest

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer │    │   API Gateway   │
│                 │───▶│                 │───▶│                 │
│ Web/Mobile/API  │    │                 │    │  Rate Limiting  │
└─────────────────┘    └─────────────────┘    │  Authentication │
                                              │  Request Routing│
                                              └─────────┬───────┘
                                                        │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                              ▼                         ▼                         ▼
                    ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
                    │  Auth Service   │       │  User Service   │       │ Product Service │
                    │    Port 3001    │       │    Port 3002    │       │    Port 3003    │
                    └─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Quick Start

### Prerequisites

* Node.js 22.11.0 or higher
* Redis server
* Docker (optional)

### Installation

1. **Clone and setup the project:**

   ```bash
   git clone <repository-url>
   cd {{projectName}}
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Redis (if not using Docker):**

   ```bash
   redis-server
   ```

4. **Start the gateway:**

   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Docker Setup

1. **Using Docker Compose (recommended):**

   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f api-gateway
   ```

2. **Build and run manually:**

   ```bash
   # Build image
   npm run docker:build
   
   # Run container
   npm run docker:run
   ```

## Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Server
NODE_ENV=production
PORT=8080

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-at-least-32-characters-long
JWT_ISSUER={{projectName}}
JWT_AUDIENCE={{projectName}}-users

# Services
AUTH_SERVICE_URL=http://localhost:3001
USERS_SERVICE_URL=http://localhost:3002
PRODUCTS_SERVICE_URL=http://localhost:3003
```

### Service Registry

Register microservices by updating the service registry in `src/middleware/proxy.js` or using the admin API:

```javascript
// Static registration
const serviceRegistry = new Map([
  ['auth', { url: 'http://localhost:3001', timeout: 30000 }],
  ['users', { url: 'http://localhost:3002', timeout: 30000 }],
]);

// Dynamic registration via API
POST /admin/services
{
  "name": "payments",
  "url": "http://payments-service:3005",
  "timeout": 30000
}
```

## API Documentation

### Core Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | Gateway information | No |
| `/health` | GET | Basic health check | No |
| `/health/detailed` | GET | Detailed health status | No |
| `/health/ready` | GET | Readiness probe | No |
| `/health/live` | GET | Liveness probe | No |
| `/api/v1/*` | ANY | Service proxy routes | Varies |
| `/admin/*` | ANY | Admin management | Yes (Admin) |

### Authentication

Include JWT token in requests:

```http
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting

Default rate limits:

* **General API**: 100 requests per 15 minutes
* **Authentication**: 5 requests per 15 minutes  
* **Public endpoints**: 1000 requests per 15 minutes
* **Admin endpoints**: 50 requests per 15 minutes

### Service Routing

Requests are routed based on URL patterns:

```
/api/v1/auth/*     → Auth Service
/api/v1/users/*    → Users Service  
/api/v1/products/* → Products Service
/api/v1/orders/*   → Orders Service
```

## Development

### Project Structure

```
src/
├── config/           # Configuration management
├── middleware/       # Express middleware
│   ├── auth.js      # JWT authentication
│   ├── rateLimiter.js # Rate limiting
│   ├── proxy.js     # Service proxy
│   └── errorHandler.js # Error handling
├── routes/          # Route definitions
├── services/        # External service integrations
├── utils/           # Utility functions
└── gateway.js       # Main application entry
```

### Available Scripts

```bash
npm start           # Start production server
npm run dev         # Start development server with hot reload
npm test            # Run test suite
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run typecheck   # Run TypeScript checks
```

### Adding New Services

1. **Register the service:**

   ```javascript
   // In src/middleware/proxy.js
   const serviceRegistry = new Map([
     // ... existing services
     ['newservice', { 
       url: process.env.NEWSERVICE_URL || 'http://localhost:3010', 
       timeout: 30000 
     }],
   ]);
   ```

2. **Add routing rules:**

   ```javascript
   // In src/routes/proxy.js
   v1Router.use('/newservice/*', jwtAuth, asyncHandler(async (req, res, next) => {
     const serviceProxy = createServiceProxy('newservice');
     return serviceProxy(req, res, next);
   }));
   ```

3. **Update environment variables:**

   ```env
   NEWSERVICE_URL=http://localhost:3010
   ```

### Testing

The project includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- gateway.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Adding Custom Middleware

Create middleware in `src/middleware/` and register in `src/middleware/index.js`:

```javascript
// src/middleware/customMiddleware.js
export function myCustomMiddleware(req, res, next) {
  // Your middleware logic
  next();
}

// src/middleware/index.js
import { myCustomMiddleware } from './customMiddleware.js';

export async function setupMiddleware(app) {
  // ... existing middleware
  app.use(myCustomMiddleware);
}
```

## Monitoring and Observability

### Health Checks

* **Basic**: `GET /health` - Simple health status
* **Detailed**: `GET /health/detailed` - Comprehensive health with dependencies
* **Readiness**: `GET /health/ready` - Kubernetes readiness probe
* **Liveness**: `GET /health/live` - Kubernetes liveness probe

### Logging

Structured JSON logging with Bunyan:

```javascript
import logger from './utils/logger.js';

logger.info('Request processed', {
  requestId: req.requestId,
  method: req.method,
  url: req.url,
  responseTime: 150,
});
```

### Metrics

Access metrics via admin endpoint:

```bash
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:8080/admin/metrics
```

## Security

### Best Practices Implemented

* **Helmet**: Security headers protection
* **CORS**: Configurable cross-origin resource sharing
* **Rate Limiting**: Redis-backed request limiting
* **Input Validation**: Request body and parameter validation
* **JWT Authentication**: Secure token-based auth
* **Role-Based Access**: Fine-grained permission control
* **No Sensitive Data Exposure**: Sanitized error responses

### Security Headers

The gateway automatically adds security headers:

* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
* `X-XSS-Protection: 1; mode=block`
* `Referrer-Policy: strict-origin-when-cross-origin`

## Deployment

### Production Checklist

* [ ] Set `NODE_ENV=production`
* [ ] Configure proper JWT secrets
* [ ] Set up Redis cluster for high availability
* [ ] Configure CORS origins for production domains
* [ ] Set up proper logging infrastructure
* [ ] Configure health check endpoints for load balancer
* [ ] Set up monitoring and alerting
* [ ] Configure SSL/TLS termination
* [ ] Review rate limiting settings
* [ ] Set up backup and disaster recovery

### Kubernetes Deployment

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      * name: api-gateway
        image: {{projectName}}:latest
        ports:
        * containerPort: 8080
        env:
        * name: NODE_ENV
          value: "production"
        * name: REDIS_URL
          value: "redis://redis-service:6379"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**

   ```bash
   # Check Redis status
   redis-cli ping
   
   # Verify Redis URL in environment
   echo $REDIS_URL
   ```

2. **Service Proxy Timeout**

   ```bash
   # Check service health
   curl http://your-service:port/health
   
   # Verify service URLs in configuration
   ```

3. **JWT Authentication Errors**

   ```bash
   # Verify JWT secret is set
   echo $JWT_SECRET
   
   # Check token expiration and format
   ```

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Run tests and linting: `npm test && npm run lint`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

* **Documentation**: Check this README and inline code comments
* **Issues**: Report bugs and request features via GitHub Issues
* **Discussions**: Join discussions in GitHub Discussions

---

**Built with ❤️ using Node.js, Express, and REST-SPEC standards**
