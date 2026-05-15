import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { config } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import neighborhoodRoutes from './routes/neighborhood.routes';
import wasteBankRoutes from './routes/waste-bank.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import sosRoutes from './routes/sos.routes';
import patrolRoutes from './routes/patrol.routes';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import database initialization
import { initializeDatabase } from '@rt-muban/shared';

// Load Swagger documentation
const swaggerDocument = yaml.load(path.join(__dirname, '../swagger.yaml'));

class App {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = config.port;

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors(config.cors));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
      },
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
        version: '1.0.0',
      });
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = '/api/v1';

    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/neighborhoods`, neighborhoodRoutes);
    this.app.use(`${apiPrefix}/waste-bank`, wasteBankRoutes);
    this.app.use(`${apiPrefix}/marketplace`, marketplaceRoutes);
    this.app.use(`${apiPrefix}/sos`, sosRoutes);
    this.app.use(`${apiPrefix}/patrol`, patrolRoutes);
  }

  private initializeSwagger(): void {
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler (must be last)
    this.app.use(errorHandler);
  }

  public async listen(): Promise<void> {
    try {
      // Initialize database (migrations and seeds)
      logger.info('Initializing database...');
      // Note: If database initialization is available from shared module, uncomment:
      // await initializeDatabase();
      
      this.app.listen(this.port, () => {
        logger.info(`🚀 API Gateway running on port ${this.port}`);
        logger.info(`📊 Swagger documentation available at /api-docs`);
        logger.info(`🏥 Health check available at /health`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

export default App;
