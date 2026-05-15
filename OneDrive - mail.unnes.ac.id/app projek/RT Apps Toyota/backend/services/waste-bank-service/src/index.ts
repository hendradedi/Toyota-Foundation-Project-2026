import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import wasteBankRoutes from './routes/waste-bank.routes';
import categoryRoutes from './routes/category.routes';
import pointsRoutes from './routes/points.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.WASTE_BANK_SERVICE_PORT || 3003;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'waste-bank-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/waste-bank/deposits', wasteBankRoutes);
app.use('/api/waste-bank/categories', categoryRoutes);
app.use('/api/waste-bank/points', pointsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Waste Bank Service running on port ${PORT}`);
});

export default app;
