import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';

// Service URLs
const SERVICE_URLS = {
  user: `http://localhost:${config.services.user.port}`,
  wasteBank: `http://localhost:${config.services.wasteBank.port}`,
  marketplace: `http://localhost:${config.services.marketplace.port}`,
  sos: `http://localhost:${config.services.sos.port}`,
  patrol: `http://localhost:${config.services.patrol.port}`,
};

// Create proxy middleware for each service
export const userServiceProxy = createProxyMiddleware({
  target: SERVICE_URLS.user,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users',
    '^/api/auth': '/api/auth',
  },
  onError: (err, req, res) => {
    logger.error('User Service proxy error:', err);
    res.status(503).json({
      success: false,
      data: null,
      message: 'User service is unavailable',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'User service is temporarily unavailable',
      },
    });
  },
});

export const wasteBankServiceProxy = createProxyMiddleware({
  target: SERVICE_URLS.wasteBank,
  changeOrigin: true,
  pathRewrite: {
    '^/api/waste-bank': '/api/waste-bank',
  },
  onError: (err, req, res) => {
    logger.error('Waste Bank Service proxy error:', err);
    res.status(503).json({
      success: false,
      data: null,
      message: 'Waste bank service is unavailable',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Waste bank service is temporarily unavailable',
      },
    });
  },
});

export const marketplaceServiceProxy = createProxyMiddleware({
  target: SERVICE_URLS.marketplace,
  changeOrigin: true,
  pathRewrite: {
    '^/api/marketplace': '/api/marketplace',
  },
  onError: (err, req, res) => {
    logger.error('Marketplace Service proxy error:', err);
    res.status(503).json({
      success: false,
      data: null,
      message: 'Marketplace service is unavailable',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Marketplace service is temporarily unavailable',
      },
    });
  },
});

export const sosServiceProxy = createProxyMiddleware({
  target: SERVICE_URLS.sos,
  changeOrigin: true,
  pathRewrite: {
    '^/api/sos': '/api/sos',
  },
  onError: (err, req, res) => {
    logger.error('SOS Service proxy error:', err);
    res.status(503).json({
      success: false,
      data: null,
      message: 'SOS service is unavailable',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'SOS service is temporarily unavailable',
      },
    });
  },
});

export const patrolServiceProxy = createProxyMiddleware({
  target: SERVICE_URLS.patrol,
  changeOrigin: true,
  pathRewrite: {
    '^/api/patrol': '/api/patrol',
  },
  onError: (err, req, res) => {
    logger.error('Patrol Service proxy error:', err);
    res.status(503).json({
      success: false,
      data: null,
      message: 'Patrol service is unavailable',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Patrol service is temporarily unavailable',
      },
    });
  },
});

// Health check middleware
export const healthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') {
    res.json({
      status: 'healthy',
      gateway: 'api-gateway',
      timestamp: new Date().toISOString(),
      services: {
        user: SERVICE_URLS.user,
        wasteBank: SERVICE_URLS.wasteBank,
        marketplace: SERVICE_URLS.marketplace,
        sos: SERVICE_URLS.sos,
        patrol: SERVICE_URLS.patrol,
      },
    });
  } else {
    next();
  }
};
