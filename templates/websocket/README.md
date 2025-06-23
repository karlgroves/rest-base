# {{projectName}} - WebSocket Server

{{description}}

A production-ready WebSocket server built with Socket.IO, Express.js, and Node.js. Features real-time communication, chat functionality, room management, and push notifications.

## Features

- **Real-time Communication**: WebSocket connections with Socket.IO
- **Chat System**: Join/leave chat rooms, send messages, typing indicators
- **Room Management**: Create/join/leave rooms with participant limits
- **Push Notifications**: Subscribe to topics and receive real-time notifications
- **Authentication**: JWT-based authentication for WebSocket connections
- **Rate Limiting**: Per-socket event rate limiting to prevent abuse
- **Health Checks**: Kubernetes-compatible health check endpoints
- **Structured Logging**: Bunyan-based structured logging with rotation
- **Security**: Helmet, CORS, input validation, and sanitization
- **Docker Support**: Multi-stage Dockerfile and Docker Compose setup
- **Production Ready**: Error handling, graceful shutdown, monitoring

## Quick Start

### Prerequisites

- Node.js >= 22.11.0
- npm >= 9.0.0
- Redis (optional, for scaling)
- PostgreSQL (optional, for persistence)

### Installation

1. **Clone or use this template**
2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**:

   ```bash
   npm run dev
   ```

5. **Access the server**:
   - WebSocket endpoint: `ws://localhost:3000`
   - HTTP API: `http://localhost:3000`
   - Health checks: `http://localhost:3000/health`

## API Endpoints

### HTTP Endpoints

- `GET /` - Service information
- `GET /health` - Health status
- `GET /health/detailed` - Detailed health information
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (Kubernetes)
- `GET /health/startup` - Startup probe (Kubernetes)
- `GET /stats` - WebSocket connection statistics

### WebSocket Events

#### Chat Events

- `chat:join` - Join a chat room
- `chat:leave` - Leave a chat room
- `chat:message` - Send a chat message
- `chat:typing` - Send typing indicator
- `chat:history` - Get chat history

#### Room Events

- `room:create` - Create a new room
- `room:join` - Join an existing room
- `room:leave` - Leave a room
- `room:list` - List available rooms
- `room:info` - Get room information

#### Notification Events

- `notification:subscribe` - Subscribe to notification topics
- `notification:unsubscribe` - Unsubscribe from topics
- `notification:mark_read` - Mark notifications as read

#### General Events

- `ping` - Ping/pong for connection testing
- `user:status` - Update user status (online, away, busy, offline)
- `heartbeat` - Heartbeat/keepalive

## Usage Examples

### Client Connection

```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});
```

### Join Chat Room

```javascript
socket.emit('chat:join', { roomId: 'room123' }, (response) => {
  if (response.success) {
    console.log('Joined chat room:', response.roomId);
  }
});
```

### Send Chat Message

```javascript
socket.emit('chat:message', {
  roomId: 'room123',
  message: 'Hello everyone!',
  type: 'text'
}, (response) => {
  if (response.success) {
    console.log('Message sent:', response.message);
  }
});
```

### Subscribe to Notifications

```javascript
socket.emit('notification:subscribe', {
  topics: ['news', 'alerts', 'user.messages']
}, (response) => {
  if (response.success) {
    console.log('Subscribed to topics:', response.subscribedTopics);
  }
});
```

## Authentication

The server uses JWT tokens for authentication. Include the token in the Socket.IO auth object:

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Token Requirements

Your JWT token should include:

- `userId` or `id` or `sub` - User identifier
- `email` - User email (optional)
- `role` - User role (user, moderator, admin)
- `exp` - Token expiration time

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT secret key | `your-secret-key-change-this` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `REDIS_URL` | Redis connection URL | - |
| `DATABASE_URL` | PostgreSQL connection URL | - |

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Docker

### Build and Run

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### Environment Setup

1. Set production environment variables
2. Use a proper JWT secret
3. Configure Redis for session storage
4. Set up PostgreSQL for data persistence
5. Configure proper CORS origins
6. Set up monitoring and logging

### Kubernetes Deployment

The application includes health check endpoints compatible with Kubernetes:

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
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 30
```

## Architecture

### Components

- **WebSocket Server**: Socket.IO server with authentication and rate limiting
- **Chat System**: Real-time chat with rooms and message history
- **Room Management**: Create and manage chat rooms with participant limits
- **Notification System**: Topic-based push notifications
- **Authentication**: JWT-based auth with role-based authorization
- **Health Checks**: Kubernetes-compatible health monitoring
- **Logging**: Structured logging with Bunyan

### Data Flow

1. Client connects with JWT token
2. Authentication middleware validates token
3. Socket handlers process events with rate limiting
4. Business logic processes requests
5. Responses sent back to clients
6. All events logged for monitoring

## Security

- JWT token authentication
- Rate limiting per socket
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- Environment-based secrets
- Role-based authorization

## Monitoring

### Logs

Logs are written to:

- `logs/app.log` - Application logs (rotated daily)
- `logs/error.log` - Error logs (rotated daily)
- Console output in development

### Metrics

- Connection statistics at `/stats`
- Health checks at `/health/*`
- Structured logging for monitoring

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check JWT token format and expiration
   - Verify JWT_SECRET environment variable

2. **Connection Issues**
   - Check CORS configuration
   - Verify allowed origins

3. **Rate Limiting**
   - Check rate limit configuration
   - Monitor client request patterns

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

## License

MIT License - see LICENSE file for details

## Author

{{author}}
