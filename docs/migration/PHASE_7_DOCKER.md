# Phase 7: Docker Containerization

## Status: ⬜ PENDING

## Objective
Dockerize backend and PostgreSQL for consistent environments across development and deployment.

## Why Docker?

**Judge line:** *"Docker ensures consistent environments across development and deployment."*

**Benefits:**
1. **Consistency:** Same environment on local, staging, production
2. **Isolation:** Dependencies don't conflict
3. **Portability:** Works on any machine with Docker
4. **Scalability:** Easy horizontal scaling
5. **DevOps Ready:** CI/CD integration, Kubernetes support

## Architecture

```
docker-compose.yml
  ├── api (Node.js backend)
  └── postgres (PostgreSQL database)
```

**Frontend:** Stays on Vercel (no need for Docker)

## File Structure

```
HireSense/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .dockerignore
└── backend/
    ├── Dockerfile
    ├── Dockerfile.prod
    └── .dockerignore
```

## 1. Backend Dockerfile (Development)

**File:** `backend/Dockerfile`
```dockerfile
# Use official Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Development command (with hot reload)
CMD ["npm", "run", "dev"]
```

## 2. Backend Dockerfile (Production)

**File:** `backend/Dockerfile.prod`
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --production

# Copy Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built files
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
```

## 3. Docker Compose (Development)

**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: hiresense-postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: hiresense
      POSTGRES_PASSWORD: hiresense_dev_password
      POSTGRES_DB: hiresense
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U hiresense']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: hiresense-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hiresense-api
    restart: unless-stopped
    ports:
      - '5000:5000'
    environment:
      NODE_ENV: development
      PORT: 5000
      DATABASE_URL: postgresql://hiresense:hiresense_dev_password@postgres:5432/hiresense
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: http://localhost:5173
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GROQ_API_KEY_1: ${GROQ_API_KEY_1}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    volumes:
      - ./backend:/app
      - /app/node_modules
      - /app/dist
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: sh -c "npx prisma migrate deploy && npm run dev"

volumes:
  postgres_data:
  redis_data:
```

## 4. Docker Compose (Production)

**File:** `docker-compose.prod.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: hiresense-postgres-prod
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hiresense
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hiresense-network

  redis:
    image: redis:7-alpine
    container_name: hiresense-redis-prod
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data_prod:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '--askpass', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - hiresense-network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: hiresense-api-prod
    restart: always
    ports:
      - '5000:5000'
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GROQ_API_KEY_1: ${GROQ_API_KEY_1}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: sh -c "npx prisma migrate deploy && node dist/server.js"
    networks:
      - hiresense-network

volumes:
  postgres_data_prod:
  redis_data_prod:

networks:
  hiresense-network:
    driver: bridge
```

## 5. .dockerignore

**File:** `backend/.dockerignore`
```
node_modules
dist
npm-debug.log
.env
.env.local
.git
.gitignore
*.md
.vscode
.idea
coverage
.nyc_output
```

**File:** `.dockerignore` (root)
```
node_modules
.git
.env
*.log
dist
build
.vercel
```

## 6. Docker Commands

### Development

**Start all services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f api
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Run migrations:**
```bash
docker-compose exec api npx prisma migrate dev
```

**Access database:**
```bash
docker-compose exec postgres psql -U hiresense -d hiresense
```

**Stop all services:**
```bash
docker-compose down
```

**Remove volumes (reset database):**
```bash
docker-compose down -v
```

### Production

**Build and start:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**View production logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Scale API (multiple instances):**
```bash
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

## 7. Health Checks

**Add health endpoint:**
```typescript
// backend/src/server.ts
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

## 8. Environment Variables

**Create `.env.docker`:**
```env
# Database
DB_USER=hiresense
DB_PASSWORD=strong_password_here
DATABASE_URL=postgresql://hiresense:strong_password_here@postgres:5432/hiresense

# Redis
REDIS_PASSWORD=redis_password_here
REDIS_URL=redis://:redis_password_here@redis:6379

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# Frontend
FRONTEND_URL=https://hiresense-gcc.vercel.app

# AI APIs
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY_1=your_groq_key_1
GROQ_API_KEY_2=your_groq_key_2

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 9. CI/CD Integration (GitHub Actions)

**File:** `.github/workflows/docker-build.yml`
```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile.prod
          push: true
          tags: yourusername/hiresense-api:latest
          cache-from: type=registry,ref=yourusername/hiresense-api:buildcache
          cache-to: type=registry,ref=yourusername/hiresense-api:buildcache,mode=max
```

## Benefits Demonstrated

### For Judges

1. **Consistency:** "Same Dockerfile runs everywhere - my laptop, staging, production"
2. **Isolation:** "PostgreSQL and Redis versions are locked, no conflicts"
3. **Reproducibility:** "Clone repo, run docker-compose up, instant dev environment"
4. **Scalability:** "Need more API instances? docker-compose scale api=5"
5. **DevOps Ready:** "One command deployment, easy CI/CD integration"

## Judge Talking Points

> **"Docker ensures consistent environments across development and deployment."**

**Show:**
- docker-compose.yml with postgres + redis + api
- Multi-stage Dockerfile for optimized production builds
- Health checks for reliability
- Volume persistence for data

**Explain:**
- "We use multi-stage builds to keep production images small (< 150 MB)"
- "Health checks ensure services are ready before accepting traffic"
- "Docker Compose orchestrates all services with one command"

## Next Steps
Proceed to [Phase 8: AI Usage Reframing](./PHASE_8_AI_USAGE.md) to document AI for judges.
