import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`User Service running on port ${PORT}`);
});

export default app;
