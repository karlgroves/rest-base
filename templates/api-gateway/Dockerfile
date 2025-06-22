# {{projectName}} API Gateway Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:22.11.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:22.11.0-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gateway -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs && chown -R gateway:nodejs /app

# Switch to non-root user
USER gateway

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { \
    if (res.statusCode === 200) process.exit(0); else process.exit(1); \
  }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/gateway.js"]

# Labels for metadata
LABEL maintainer="{{author}}" \
      description="{{description}}" \
      version="1.0.0" \
      org.opencontainers.image.title="{{projectName}}" \
      org.opencontainers.image.description="{{description}}" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
      org.opencontainers.image.source="https://github.com/your-org/{{projectName}}"