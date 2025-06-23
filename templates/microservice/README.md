# {{projectName}} Microservice

{{description}}

A production-ready microservice built with Node.js and Express, following REST-SPEC standards.

## Features

- **RESTful API**: Clean REST API design with proper HTTP methods and status codes
- **Health Checks**: Kubernetes-ready health endpoints (liveness, readiness, startup)
- **Security**: Helmet.js, CORS, rate limiting, input validation
- **Logging**: Structured logging with Bunyan
- **Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Testing**: Comprehensive test suite with Jest
- **Docker**: Multi-stage Dockerfile with security best practices
- **Performance**: Built-in performance monitoring and benchmarking
- **Database**: PostgreSQL integration with connection pooling
- **Caching**: Redis integration for performance optimization

## Quick Start

### Prerequisites

- Node.js 22.11.0 or higher
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Local Development

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Access the application:**
   - API: <http://localhost:3000/api>
   - Health: <http://localhost:3000/health>
   - Documentation: <http://localhost:3000/api-docs>

### Docker Development

1. **Start all services:**

   ```bash
   docker-compose up
   ```

2. **Start with management tools:**

   ```bash
   docker-compose --profile tools up
   ```

3. **Access services:**
   - API: <http://localhost:3000>
   - Adminer (DB): <http://localhost:8080>
   - Redis Commander: <http://localhost:8081>

## API Endpoints

### Core Endpoints

- `GET /` - Service information
- `GET /api` - API information and available endpoints
- `GET /api-docs` - Interactive API documentation

### Health Endpoints

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed health information
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/startup` - Kubernetes startup probe

### Business Endpoints

- `GET /api/items` - List items with pagination and search
- `GET /api/items/:id` - Get specific item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

## Configuration

The microservice uses environment variables for configuration. See `.env.example` for all available options.

### Key Configuration Areas

- **Server**: Port, host, environment
- **Database**: PostgreSQL connection settings
- **Redis**: Cache configuration
- **Security**: JWT secrets, CORS origins
- **Features**: Feature flags for optional functionality

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run benchmark` - Run performance benchmarks

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- items.test.js

# Run tests in watch mode
npm run test:watch
```

### Code Quality

The project includes:

- **ESLint**: Code linting with Airbnb configuration
- **Prettier**: Code formatting
- **Jest**: Testing framework with coverage reporting
- **Husky**: Git hooks for quality checks

## Deployment

### Production Environment

1. **Build Docker image:**

   ```bash
   docker build -t {{projectName}}-microservice .
   ```

2. **Run container:**

   ```bash
   docker run -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL=your-database-url \
     -e REDIS_URL=your-redis-url \
     {{projectName}}-microservice
   ```

### Kubernetes Deployment

The microservice includes health check endpoints that work with Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5

startupProbe:
  httpGet:
    path: /health/startup
    port: 3000
  failureThreshold: 30
  periodSeconds: 10
```

## Monitoring

### Health Checks

The microservice provides comprehensive health monitoring:

- **System**: CPU, memory, disk usage
- **Database**: PostgreSQL connection health
- **Cache**: Redis connection health
- **External Services**: Upstream service health

### Logging

Structured logging with Bunyan provides:

- JSON-formatted logs for easy parsing
- Log rotation to prevent disk space issues
- Different log levels for different environments
- Request/response logging for debugging
- Error tracking with stack traces

### Performance

- Built-in performance benchmarking
- Response time monitoring
- Memory usage tracking
- Database operation timing

## Security

The microservice implements multiple security layers:

- **Helmet.js**: Security headers
- **CORS**: Cross-origin request protection
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize user input
- **JWT Authentication**: Secure API access
- **Environment Variables**: Secure configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:

- **Documentation**: /api-docs endpoint
- **Health Status**: /health endpoint
- **Issues**: Create an issue in the repository
