import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import sosRoutes from './routes/sos.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.SOS_SERVICE_PORT || 3005;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Rate limiting - Higher limit for emergency service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sos-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/sos', sosRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`SOS Service running on port ${PORT}`);
});

export default app;
