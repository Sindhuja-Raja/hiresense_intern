import express, { Application, Request, Response } from 'express';
import net from 'net';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import passport, { initializePassport } from './config/passport';

// Import routes - Basic recruitment system only
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import recruiterRoutes from './routes/recruiter.routes';
import profileRoutes from './routes/profile.routes';
import scoringRoutes from './routes/scoring.routes';
import interviewRoutes from './routes/interview.routes';
import notificationRoutes from './routes/notification.routes';
import interviewReadinessRoutes from './routes/interview-readiness.routes';
import aiRoutes from './routes/ai.routes';

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is required. Set it in your environment.');
  process.exit(1);
}

// Initialize Passport OAuth strategies
initializePassport();

const app: Application = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - must be first to handle all requests
const normalizeOrigin = (value: string) => value.replace(/\/$/, '');

const allowedOrigins = new Set([
  normalizeOrigin(process.env.FRONTEND_URL || 'http://localhost:8080'),
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://127.0.0.1:5173',
  'https://hiresense-gcc.vercel.app',
]);

// Enable CORS for all routes
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const normalized = normalizeOrigin(origin);
    
    // Check if origin is in allowed list
    if (allowedOrigins.has(normalized)) {
      return callback(null, true);
    }
    
    // Allow localhost with any port
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
      return callback(null, true);
    }
    
    // Log blocked origin for debugging
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours
}));

// Handle preflight requests
app.options('*', cors());
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with 10MB limit for resumes
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(passport.initialize()); // Initialize Passport

// Ensure database connection for each request in serverless
if (process.env.VERCEL === '1') {
  app.use(async (req: Request, res: Response, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      console.error('DB connection error in middleware:', error);
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  });
}

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Recruitment Portal API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      jobs: '/api/jobs',
      applications: '/api/applications',
      readiness: '/api/interview-readiness'
    }
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Recruitment Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes - Basic recruitment system
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interview-readiness', interviewReadinessRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
let server: any;

const startServer = async () => {
  try {
    const port = Number(PORT);
    const isPortInUse = await new Promise<boolean>((resolve) => {
      const client = net.createConnection({ port, host: '127.0.0.1' }, () => {
        client.end();
        resolve(true);
      });
      client.once('error', () => resolve(false));
    });

    if (isPortInUse) {
      console.warn(`⚠️ Port ${port} is already in use. Backend may already be running.`);
      return;
    }

    await connectDB();
    
    server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
    });

    // Handle unhandled errors
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    // Graceful shutdown - CRITICAL for Windows/nodemon
    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received: Graceful shutdown...');
      server?.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received: Graceful shutdown...');
      server?.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if not in a serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
  startServer();
} else {
  // For Vercel serverless, connect to DB with caching
  let isConnected = false;
  const connectOnce = async () => {
    if (!isConnected) {
      try {
        await connectDB();
        isConnected = true;
      } catch (error) {
        console.error('Failed to connect to database:', error);
      }
    }
  };
  connectOnce();
}

export default app;
