# Phase 6: Validation & Security Hardening

## Status: ⬜ PENDING

## Objective
Implement centralized validation, rate limiting, SQL injection prevention, and security best practices.

## 1. Input Validation Layer

### Create Validation Schemas
**File:** `backend/src/validators/application.validator.ts`
```typescript
import { z } from 'zod';

export const applyToJobSchema = z.object({
  body: z.object({
    jobId: z.string().uuid('Invalid job ID format'),
  }),
});

export const updateApplicationStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['applied', 'shortlisted', 'rejected', 'interview_scheduled']),
  }),
});

export const bulkRejectSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  body: z.object({
    applicationIds: z.array(z.string().uuid()).min(1).max(100),
  }),
});
```

### Validation Middleware
**File:** `backend/src/middleware/validate.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
```

### Apply to Routes
```typescript
import { validate } from '../middleware/validate.middleware';
import { applyToJobSchema } from '../validators/application.validator';

router.post(
  '/',
  authenticate,
  authorizeRole('applicant'),
  validate(applyToJobSchema),
  applyForJob
);
```

## 2. Rate Limiting

### Install Dependencies
```bash
npm install express-rate-limit redis ioredis
```

### Configure Rate Limiter
**File:** `backend/src/middleware/rateLimiter.middleware.ts`
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Global rate limit (100 requests per 15 minutes)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:global:',
  }),
});

// Authentication endpoints (5 attempts per 15 minutes)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
});

// AI endpoints (10 requests per hour)
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'AI quota exceeded, please try again later',
  store: new RedisStore({
    client: redis,
    prefix: 'rl:ai:',
  }),
});

// Application endpoints (20 applications per hour per user)
export const applicationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Application limit reached, please try again later',
  store: new RedisStore({
    client: redis,
    prefix: 'rl:app:',
  }),
});
```

### Apply to Server
**File:** `backend/src/server.ts`
```typescript
import { globalRateLimiter, authRateLimiter, aiRateLimiter } from './middleware/rateLimiter.middleware';

// Apply global rate limiter
app.use('/api', globalRateLimiter);

// Apply specific rate limiters
app.use('/api/auth/signin', authRateLimiter);
app.use('/api/auth/signup', authRateLimiter);
app.use('/api/ai', aiRateLimiter);
```

## 3. SQL Injection Prevention

### ✅ Prisma is Safe by Default
Prisma uses parameterized queries automatically:

```typescript
// ✅ Safe: Prisma parameterizes automatically
await prisma.user.findMany({
  where: { email: userInput }, // Automatically escaped
});

// ✅ Safe: Raw query with parameters
await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// ❌ NEVER do this:
await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);
```

### Validate UUIDs
```typescript
import { z } from 'zod';

const uuidSchema = z.string().uuid();

// Validate before querying
const validatedId = uuidSchema.parse(req.params.id);
const user = await prisma.user.findUnique({ where: { id: validatedId } });
```

## 4. Authentication & Authorization

### JWT Configuration
**File:** `backend/src/config/jwt.config.ts`
```typescript
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: '7d',
  algorithm: 'HS256' as const,
  issuer: 'hiresense-api',
  audience: 'hiresense-frontend',
};

// Validate JWT_SECRET exists and is strong
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

### Enhanced Auth Middleware
**File:** `backend/src/middleware/auth.middleware.ts`
```typescript
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { prisma } from '../config/database';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }) as { id: string; role: string };

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        is_email_verified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Authentication error' });
  }
};

export const authorizeRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// Check ownership
export const authorizeOwnership = (resourceType: 'application' | 'job') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id;

      if (resourceType === 'job') {
        const job = await prisma.job.findUnique({ where: { id: resourceId } });
        if (!job || job.recruiterId !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};
```

## 5. CORS Configuration

**File:** `backend/src/config/cors.config.ts`
```typescript
import cors from 'cors';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8080',
].filter(Boolean);

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};
```

## 6. Helmet Configuration

```typescript
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

## 7. Environment Variable Validation

**File:** `backend/src/config/env.config.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  FRONTEND_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  GROQ_API_KEY_1: z.string().min(1),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.string().transform(Number),
  EMAIL_USER: z.string().email(),
  EMAIL_PASSWORD: z.string(),
  REDIS_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

## 8. Sanitization

```typescript
import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // No HTML tags
    allowedAttributes: {},
  });
}

// Use in controllers
const sanitizedDescription = sanitizeInput(req.body.description);
```

## Security Checklist

- [x] Input validation (Zod)
- [x] Rate limiting (express-rate-limit + Redis)
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] JWT with strong secret (>32 chars)
- [x] CORS configured
- [x] Helmet headers
- [x] Password hashing (bcrypt, 10 rounds)
- [x] Environment validation
- [x] HTTPS in production
- [x] Role-based access control
- [ ] CSRF protection (if needed for cookies)
- [ ] File upload validation (size, type)
- [ ] API versioning (/api/v1)
- [ ] Logging & monitoring (Winston, Sentry)

## Judge Talking Points

> **"Validation happens at both client and server for data integrity."**

**Show:**
- Zod schema example
- Rate limiter configuration
- Prisma parameterized queries
- JWT verification with expiry

**Explain:**
- "We validate all inputs with TypeScript schemas"
- "Rate limiting prevents abuse and DoS attacks"
- "Prisma prevents SQL injection by design"
- "JWTs expire after 7 days and are verified on every request"

## Next Steps
Proceed to [Phase 7: Docker Setup](./PHASE_7_DOCKER.md) to containerize the application.
