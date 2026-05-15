import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import {
  healthCheck,
  userServiceProxy,
  wasteBankServiceProxy,
  marketplaceServiceProxy,
  sosServiceProxy,
  patrolServiceProxy,
} from './middleware/proxy.middleware';

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.use(healthCheck);

// Public routes (no authentication required)
app.use('/api/auth', userServiceProxy);

// Protected routes (authentication required)
app.use('/api/users', authMiddleware, userServiceProxy);
app.use('/api/waste-bank', authMiddleware, wasteBankServiceProxy);
app.use('/api/marketplace', authMiddleware, marketplaceServiceProxy);
app.use('/api/sos', authMiddleware, sosServiceProxy);
app.use('/api/patrol', authMiddleware, patrolServiceProxy);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The route ${req.originalUrl} does not exist`,
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Service endpoints:');
  logger.info(`  User Service: http://localhost:${config.services.user.port}`);
  logger.info(`  Waste Bank Service: http://localhost:${config.services.wasteBank.port}`);
  logger.info(`  Marketplace Service: http://localhost:${config.services.marketplace.port}`);
  logger.info(`  SOS Service: http://localhost:${config.services.sos.port}`);
  logger.info(`  Patrol Service: http://localhost:${config.services.patrol.port}`);
});

export default app;
