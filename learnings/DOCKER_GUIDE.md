# Docker Service Containerization Guide

This guide documents the complete process of dockerizing a Node.js/TypeScript backend service with PostgreSQL database, based on the `update/dockerise` branch implementation.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Key Docker Concepts](#key-docker-concepts)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Networking in Docker](#networking-in-docker)
5. [Data Persistence](#data-persistence)
6. [Best Practices](#best-practices)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Production Considerations](#production-considerations)

## Project Structure

```
project-root/
├── docker-compose.yml          # Main orchestration file
├── .env                       # Environment variables
├── .dockerignore              # Docker build exclusions
├── backend/                   # Backend service
│   ├── Dockerfile             # Backend container definition
│   ├── package.json
│   ├── package-lock.json      # ✅ Must commit for npm ci
│   └── src/
│       └── plugins/
│           └── external/
│               └── env.ts     # Environment configuration
└── volumes/                   # (managed by Docker)
    └── db_data/               # Database persistence
```

## Key Docker Concepts

### Docker Compose vs Single Container
- **Single Container**: `docker build && docker run` (simple services)
- **Docker Compose**: Multi-service orchestration (backend + database + etc.)

### Service Discovery
- Services communicate using service names (not localhost)
- `backend` → `db:5432` (not `localhost:5432`)
- Docker provides internal DNS resolution

### Environment Variables
- **Container isolation**: Environment must be explicitly passed
- **Configuration management**: Use `.env` file for local development
- **Security**: Never commit sensitive data to repository

## Step-by-Step Implementation

### 1. Database Service (docker-compose.yml)

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DATABASE}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - 5432:5432
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DATABASE}"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    volumes:
      - db_data:/var/lib/postgresql/data
```

**Key Components:**
- `restart: unless-stopped` - Automatic recovery on failures
- Health check with `start_period` - Database readiness assurance
- Volume mount - Data persistence across container restarts
- Environment variable injection - Secure configuration

### 2. Backend Service (Dockerfile)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

**Key Components:**
- Multi-stage build optimization
- Dependency caching strategy
- Production environment setup
- Clean separation of concerns

### 3. Backend Service (docker-compose.yml)

```yaml
services:
  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      - NODE_ENV=${NODE_ENV}
      - POSTGRES_HOST=${POSTGRES_HOST}
      - POSTGRES_PORT=${POSTGRES_PORT}
      - POSTGRES_DATABASE=${POSTGRES_DATABASE}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - COOKIE_NAME=${COOKIE_NAME}
      - RATE_LIMIT_MAX=${RATE_LIMIT_MAX}
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
```

### 4. Environment Configuration (.env)

```bash
# .env
NODE_ENV=production

# Database
POSTGRES_HOST=db              # ⚠️ Not localhost!
POSTGRES_PORT=5432
POSTGRES_DATABASE=test_db
POSTGRES_USER=test_user
POSTGRES_PASSWORD=test_password

# Security
COOKIE_SECRET=your-secret-key
COOKIE_NAME=sessionid
RATE_LIMIT_MAX=50
```

### 5. Build Optimization (.dockerignore)

```dockerfile
# .dockerignore
node_modules
dist
*.tsbuildinfo
.env
.env.*
.git
.vscode
coverage/
*.log
```

## Networking in Docker

### Service Communication

**Before Docker (local development):**
```bash
Backend → localhost:5432 → PostgreSQL
```

**After Docker (containerized):**
```bash
Backend Container → db:5432 → Database Container
```

### Key Networking Changes

1. **Service Name Resolution**: `db` resolves to database container IP
2. **Internal Network**: Containers communicate on isolated Docker network
3. **Port Mapping**: Only expose necessary ports to host

### Common Networking Issues

**Issue:** `ECONNREFUSED 127.0.0.1:5432`
```bash
# Problem: Using localhost in container
POSTGRES_HOST=localhost

# Solution: Use service name
POSTGRES_HOST=db
```

## Data Persistence

### Volume Management

```yaml
volumes:
  db_data:  # Named volume
```

**Volume Location:**
- **Container path**: `/var/lib/postgresql/data`
- **Host path**: `/var/lib/docker/volumes/setup_db_data/_data`

### Persistence Benefits

- **Data survives container recreation**
- **Easy backup capabilities**
- **Stateless application design**
- **Development consistency**

## Best Practices

### 1. Build Optimization

```dockerfile
# ✅ Good - Copy package files first
COPY package*.json ./
RUN npm ci
COPY . .

# ❌ Bad - Copy everything at once
COPY . .
RUN npm ci
```

### 2. Environment Management

```yaml
# ✅ Good - Use environment files
environment:
  - NODE_ENV=${NODE_ENV}
  - POSTGRES_HOST=${POSTGRES_HOST}

# ❌ Bad - Hardcode values
environment:
  - NODE_ENV=production
  - POSTGRES_HOST=localhost
```

### 3. Dependency Management

```bash
# ✅ Always commit package-lock.json
git add package.json package-lock.json

# ✅ Use npm ci for reproducible builds
RUN npm ci

# ❌ Don't use npm install in containers
RUN npm install
```

### 4. Production Configuration

```json
// package.json
{
  "scripts": {
    "start": "npm run build && fastify start...",
    "build": "tsc"
  }
}
```

**Always run in production mode in containers** for:
- Consistent behavior across environments
- Better performance and security
- Production parity testing

## Common Issues & Solutions

### 1. Database Connection Issues

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Change in .env
POSTGRES_HOST=localhost  →  POSTGRES_HOST=db
```

### 2. Environment Variables Not Loading

**Issue:** Fastify env plugin can't find .env file

**Solution:**
```typescript
// backend/src/plugins/external/env.ts
export const autoConfig = {
  dotenv: true,  // Use default .env file
  // NOT custom path
}
```

### 3. Build Performance Issues

**Issue:** Slow Docker builds

**Solution:**
- Add `.dockerignore` file
- Optimize layer caching
- Use `npm ci` instead of `npm install`

### 4. Missing Dependencies

**Issue:** Build fails due to missing dev dependencies

**Solution:**
```dockerfile
# ✅ Install all dependencies (needed for build)
RUN npm ci

# ❌ Don't use --only=production if you need to build in container
RUN npm ci --only=production
```

## Production Considerations

### 1. Security

- **Environment variables**: Use Docker secrets or secure environment management
- **Base images**: Use official, minimal images (alpine variants)
- **User permissions**: Run as non-root user when possible
- **Port exposure**: Only expose necessary ports

### 2. Performance

- **Multi-stage builds**: Separate build and runtime environments
- **Image size**: Use minimal base images and clean up unnecessary files
- **Resource limits**: Set CPU and memory limits in production

### 3. Monitoring

- **Health checks**: Implement application-level health checks
- **Logging**: Configure proper log drivers and aggregation
- **Metrics**: Add monitoring endpoints and tools

### 4. Scaling

- **Service scaling**: Use Docker Compose scale or Kubernetes
- **Load balancing**: Implement reverse proxy (nginx, traefik)
- **Database scaling**: Consider connection pooling and clustering

## Complete Working Example

### Final docker-compose.yml

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DATABASE}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - 5432:5432
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DATABASE}"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    volumes:
      - db_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      - NODE_ENV=${NODE_ENV}
      - POSTGRES_HOST=${POSTGRES_HOST}
      - POSTGRES_PORT=${POSTGRES_PORT}
      - POSTGRES_DATABASE=${POSTGRES_DATABASE}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - COOKIE_NAME=${COOKIE_NAME}
      - RATE_LIMIT_MAX=${RATE_LIMIT_MAX}
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy

volumes:
  db_data:
```

### Commands for Development

```bash
# Start all services
docker compose up

# Start in detached mode
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f backend
docker compose logs -f db

# Rebuild and restart
docker compose build && docker compose up
```

## Next Steps

1. **Add health checks** to backend service
2. **Implement logging** and monitoring
3. **Add CI/CD pipeline** for automated Docker builds
4. **Consider orchestration** (Kubernetes, Docker Swarm)
5. **Add security scanning** to build process

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/README.md)
- [PostgreSQL Docker Images](https://hub.docker.com/_/postgres)

---

This guide captures all the learnings from dockerizing the backend service, including common pitfalls and best practices discovered during implementation.