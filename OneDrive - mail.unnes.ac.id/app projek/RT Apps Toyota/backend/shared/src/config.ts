import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'rt_muban',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    ssl: process.env.DB_SSL === 'true',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL || '86400'), // 24 hours in seconds
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Authentication configuration
  auth: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '30'), // minutes
  },

  // Service ports
  services: {
    user: {
      port: process.env.USER_SERVICE_PORT || 3001,
    },
    wasteBank: {
      port: process.env.WASTE_BANK_SERVICE_PORT || 3003,
    },
    marketplace: {
      port: process.env.MARKETPLACE_SERVICE_PORT || 3004,
    },
    sos: {
      port: process.env.SOS_SERVICE_PORT || 3005,
    },
    patrol: {
      port: process.env.PATROL_SERVICE_PORT || 3006,
    },
  },

  // CORS configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3002'],
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@rt-muban.org',
  },

  // SMS configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES
      ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    storagePath: process.env.UPLOAD_PATH || './uploads',
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
};

export type Config = typeof config;
