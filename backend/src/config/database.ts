import mongoose from 'mongoose';

// Cache the connection promise for serverless
let cachedConnection: typeof mongoose | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

// Seed default recruiter account
const seedDefaultRecruiter = async () => {
  try {
    const { User } = await import('../models/User.model');

    const seedEnabled = process.env.SEED_DEFAULT_RECRUITER === 'true'
      || process.env.NODE_ENV !== 'production';
    if (!seedEnabled) {
      return;
    }

    const seedEmail = process.env.DEFAULT_RECRUITER_EMAIL || 'recruiter@company.com';
    const seedPassword = process.env.DEFAULT_RECRUITER_PASSWORD || 'Recruiter@123';
    const seedName = process.env.DEFAULT_RECRUITER_NAME || 'Company Recruiter';

    const existingRecruiter = await User.findOne({ email: seedEmail });
    if (!existingRecruiter) {
      await User.create({
        email: seedEmail,
        password: seedPassword,
        fullName: seedName,
        role: 'recruiter'
      });
      console.log(`✅ Default recruiter created: ${seedEmail}`);
    }
  } catch (error) {
    console.log('⚠️ Seed skipped:', (error as Error).message);
  }
};

export const connectDB = async (): Promise<void> => {
  // If already connected, return
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Connection options with timeout and retry settings
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      bufferCommands: false, // Disable buffering for serverless
    };

    console.log('🔄 Connecting to MongoDB...');
    connectionPromise = mongoose.connect(mongoURI, options);
    cachedConnection = await connectionPromise;
    connectionPromise = null;

    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);

    // Seed default recruiter
    await seedDefaultRecruiter();

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      cachedConnection = null;
    });

    // Graceful shutdown (only for non-serverless)
    if (process.env.VERCEL !== '1') {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed due to app termination');
        process.exit(0);
      });
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    connectionPromise = null;
    cachedConnection = null;
    // Don't exit in serverless environment
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw error;
  }
};
