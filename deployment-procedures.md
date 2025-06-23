# Deployment Procedures Guide

This document provides comprehensive deployment procedures for REST-Base applications, covering various environments and deployment strategies.

## Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Deployment Strategies](#deployment-strategies)
- [Platform-Specific Deployments](#platform-specific-deployments)
- [Container Deployments](#container-deployments)
- [Database Migrations](#database-migrations)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Rollback Procedures](#rollback-procedures)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Overview

### Deployment Environments

REST-Base applications typically deploy to these environments:

1. **Development** - Local development and testing
2. **Staging** - Pre-production testing environment
3. **Production** - Live user-facing environment
4. **Testing** - Automated testing and CI/CD

### Deployment Pipeline

```
Code Commit → CI/CD Pipeline → Testing → Staging → Production
     ↓             ↓            ↓          ↓           ↓
  Linting      Unit Tests   Integration  User      Performance
  Type Check   E2E Tests    Tests        Testing   Monitoring
```

## Pre-Deployment Checklist

### Code Quality Verification

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Security scan passes (`npm audit`)
- [ ] Code coverage meets minimum threshold (80%)

### Dependencies and Configuration

- [ ] Dependencies are up to date and audited
- [ ] Environment variables are configured
- [ ] Configuration files are validated
- [ ] Secrets are properly managed
- [ ] Database migrations are ready

### Documentation and Validation

- [ ] API documentation is updated
- [ ] Changelog is updated
- [ ] Version number is bumped
- [ ] README is current
- [ ] Deployment notes are prepared

## Environment Configuration

### Environment Variables

Create environment-specific `.env` files:

```bash
# Production (.env.production)
NODE_ENV=production
PORT=3000
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=myapp_prod
DB_USER=app_user
DB_PASSWORD=${SECRET_DB_PASSWORD}
REDIS_URL=redis://prod-redis.example.com:6379
JWT_SECRET=${SECRET_JWT_KEY}
API_KEY=${SECRET_API_KEY}
LOG_LEVEL=info
CORS_ORIGIN=https://myapp.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

```bash
# Staging (.env.staging)
NODE_ENV=staging
PORT=3000
DB_HOST=staging-db.example.com
DB_PORT=5432
DB_NAME=myapp_staging
DB_USER=app_user
DB_PASSWORD=${SECRET_DB_PASSWORD_STAGING}
REDIS_URL=redis://staging-redis.example.com:6379
JWT_SECRET=${SECRET_JWT_KEY_STAGING}
LOG_LEVEL=debug
CORS_ORIGIN=https://staging.myapp.com
```

### Configuration Management

Use a configuration management system:

```javascript
// config/index.js
const config = {
  development: {
    port: 3000,
    database: {
      host: 'localhost',
      port: 5432,
      name: 'myapp_dev'
    }
  },
  staging: {
    port: process.env.PORT || 3000,
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME
    }
  },
  production: {
    port: process.env.PORT || 3000,
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME
    },
    cache: {
      ttl: 3600,
      maxSize: 1000
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

## Deployment Strategies

### 1. Blue-Green Deployment

Maintain two identical production environments:

```bash
# Deploy to green environment
kubectl apply -f k8s/green-deployment.yaml

# Test green environment
curl https://green.myapp.com/health

# Switch traffic to green
kubectl patch service myapp-service -p '{"spec":{"selector":{"version":"green"}}}'

# Verify deployment
kubectl get pods -l version=green

# Keep blue as rollback option
```

### 2. Rolling Deployment

Gradually replace instances:

```bash
# Update deployment with rolling strategy
kubectl set image deployment/myapp-deployment app=myapp:v2.1.0

# Monitor rollout
kubectl rollout status deployment/myapp-deployment

# Verify all pods are updated
kubectl get pods -l app=myapp
```

### 3. Canary Deployment

Deploy to subset of users:

```bash
# Deploy canary version (10% traffic)
kubectl apply -f k8s/canary-deployment.yaml

# Monitor metrics for canary
kubectl logs -l version=canary

# Gradually increase traffic
kubectl patch virtualservice myapp-vs --type='merge' -p='{"spec":{"http":[{"match":[{"headers":{"canary":{"exact":"true"}}}],"route":[{"destination":{"host":"myapp","subset":"canary"}}]},{"route":[{"destination":{"host":"myapp","subset":"stable"},"weight":90},{"destination":{"host":"myapp","subset":"canary"},"weight":10}]}]}}'

# Full rollout if successful
kubectl apply -f k8s/production-deployment.yaml
```

## Platform-Specific Deployments

### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create application
heroku create myapp-prod

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DB_URL=${DATABASE_URL}

# Add buildpacks
heroku buildpacks:add heroku/nodejs

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=2

# Check logs
heroku logs --tail
```

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init myapp --region us-east-1

# Create environment
eb create production --instance-type t3.medium

# Deploy
eb deploy

# Set environment variables
eb setenv NODE_ENV=production DB_HOST=prod-db.us-east-1.rds.amazonaws.com

# Monitor
eb health
eb logs
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: myapp
services:
- name: api
  source_dir: /
  github:
    repo: myorg/myapp
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 2
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_CONNECTION
    type: SECRET
    value: ${DATABASE_URL}
  health_check:
    http_path: /health
```

### Google Cloud Platform

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Initialize gcloud
gcloud init

# Deploy to App Engine
gcloud app deploy app.yaml

# Deploy to Cloud Run
gcloud run deploy myapp \
  --image gcr.io/PROJECT_ID/myapp:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Set environment variables
gcloud run services update myapp \
  --set-env-vars NODE_ENV=production,DB_HOST=10.0.0.1
```

## Container Deployments

### Docker Setup

```dockerfile
# Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001 -G nodejs

# Change ownership
RUN chown -R app:nodejs /app
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  app:
    image: myapp:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp_prod
      - POSTGRES_USER=app_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-host
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Database Migrations

### Migration Strategy

```javascript
// migrations/001_initial_schema.js
exports.up = async function(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('users');
};
```

### Pre-Deployment Migration Script

```bash
#!/bin/bash
# scripts/deploy-migrate.sh

set -e

echo "Starting database migration..."

# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run migrate:latest

# Verify migration
npm run migrate:status

echo "Migration completed successfully"
```

### Safe Migration Practices

1. **Always backup before migrations**
2. **Test migrations on staging first**
3. **Use transactions for complex changes**
4. **Plan rollback migrations**
5. **Monitor performance impact**

```javascript
// Safe migration example
exports.up = async function(knex) {
  // Use transaction for multiple operations
  await knex.transaction(async (trx) => {
    // Add column with default value first
    await trx.schema.table('users', (table) => {
      table.string('status').defaultTo('active');
    });
    
    // Populate new column
    await trx('users').update({ status: 'active' });
    
    // Make column non-nullable
    await trx.schema.alterTable('users', (table) => {
      table.string('status').notNullable().alter();
    });
  });
};
```

## Monitoring and Health Checks

### Health Check Endpoints

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const redis = require('../redis');

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalServices()
  ]);

  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {
      database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      external: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
    }
  };

  const isHealthy = Object.values(results.checks).every(status => status === 'healthy');
  results.status = isHealthy ? 'healthy' : 'unhealthy';

  res.status(isHealthy ? 200 : 503).json(results);
});

async function checkDatabase() {
  const result = await db.raw('SELECT 1');
  return result.rowCount === 1;
}

async function checkRedis() {
  await redis.ping();
  return true;
}

async function checkExternalServices() {
  // Check external API dependencies
  const response = await fetch('https://api.external.com/health');
  return response.ok;
}

module.exports = router;
```

### Application Metrics

```javascript
// monitoring/metrics.js
const prometheus = require('prom-client');

// Default metrics
prometheus.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

module.exports = {
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  register: prometheus.register
};
```

## Rollback Procedures

### Quick Rollback Strategy

```bash
#!/bin/bash
# scripts/rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback.sh <previous_version>"
  exit 1
fi

echo "Rolling back to version $PREVIOUS_VERSION..."

# Kubernetes rollback
kubectl rollout undo deployment/myapp-deployment --to-revision=$PREVIOUS_VERSION

# Wait for rollback to complete
kubectl rollout status deployment/myapp-deployment

# Verify health
./scripts/health-check.sh

echo "Rollback completed"
```

### Database Rollback

```bash
#!/bin/bash
# scripts/rollback-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./rollback-db.sh <backup_file>"
  exit 1
fi

echo "Rolling back database from $BACKUP_FILE..."

# Stop application
kubectl scale deployment myapp-deployment --replicas=0

# Restore database
psql $DATABASE_URL < $BACKUP_FILE

# Start application
kubectl scale deployment myapp-deployment --replicas=3

echo "Database rollback completed"
```

## Security Considerations

### Deployment Security Checklist

- [ ] Use HTTPS/TLS encryption
- [ ] Implement proper authentication
- [ ] Secure environment variables
- [ ] Regular security updates
- [ ] Network security (VPC, firewalls)
- [ ] Container security scanning
- [ ] Secrets management
- [ ] Access logging and monitoring

### Secrets Management

```bash
# Using Kubernetes secrets
kubectl create secret generic app-secrets \
  --from-literal=db-password=secret123 \
  --from-literal=jwt-secret=jwtsecret456

# Using HashiCorp Vault
vault kv put secret/myapp \
  db_password=secret123 \
  jwt_secret=jwtsecret456

# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name myapp/production \
  --secret-string '{"db_password":"secret123","jwt_secret":"jwtsecret456"}'
```

### SSL/TLS Configuration

```nginx
# nginx SSL configuration
server {
    listen 443 ssl http2;
    server_name myapp.com;

    ssl_certificate /etc/nginx/ssl/myapp.crt;
    ssl_certificate_key /etc/nginx/ssl/myapp.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Performance Optimization

### Production Optimizations

```javascript
// app.js production configuration
if (process.env.NODE_ENV === 'production') {
  // Enable compression
  app.use(compression());
  
  // Set security headers
  app.use(helmet());
  
  // Enable trust proxy
  app.set('trust proxy', 1);
  
  // Configure session for production
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}
```

### Load Balancing

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - myapp.com
    secretName: myapp-tls
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-service
            port:
              number: 80
```

## Troubleshooting

### Common Deployment Issues

#### Issue: Application Won't Start

```bash
# Check logs
kubectl logs deployment/myapp-deployment

# Check environment variables
kubectl describe pod <pod-name>

# Check resource limits
kubectl top pod <pod-name>

# Debug with shell access
kubectl exec -it <pod-name> -- /bin/sh
```

#### Issue: Database Connection Fails

```bash
# Test database connectivity
kubectl run db-test --image=postgres:15 --rm -it -- psql $DATABASE_URL

# Check network policies
kubectl get networkpolicy

# Verify secrets
kubectl get secret app-secrets -o yaml
```

#### Issue: Performance Problems

```bash
# Monitor resource usage
kubectl top nodes
kubectl top pods

# Check application metrics
curl https://myapp.com/metrics

# Analyze slow queries
tail -f /var/log/postgresql/postgresql.log | grep "slow query"
```

### Deployment Verification Script

```bash
#!/bin/bash
# scripts/verify-deployment.sh

APP_URL=$1
EXPECTED_VERSION=$2

echo "Verifying deployment..."

# Check health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/health)
if [ $HEALTH_STATUS -ne 200 ]; then
  echo "Health check failed: HTTP $HEALTH_STATUS"
  exit 1
fi

# Check version
ACTUAL_VERSION=$(curl -s $APP_URL/health | jq -r '.version')
if [ "$ACTUAL_VERSION" != "$EXPECTED_VERSION" ]; then
  echo "Version mismatch: expected $EXPECTED_VERSION, got $ACTUAL_VERSION"
  exit 1
fi

# Check database connectivity
curl -s $APP_URL/health/detailed | jq '.checks.database' | grep -q "healthy"
if [ $? -ne 0 ]; then
  echo "Database health check failed"
  exit 1
fi

echo "Deployment verification successful"
```

## Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Backup and Recovery](https://www.postgresql.org/docs/current/backup.html)
- [Application Security Guidelines](https://owasp.org/www-project-top-ten/)
