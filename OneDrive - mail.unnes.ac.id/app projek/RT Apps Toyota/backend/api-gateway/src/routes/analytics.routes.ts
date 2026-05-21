/**
 * Analytics API Routes
 * Endpoints for dashboard analytics and metrics
 */

import { Router, Request, Response } from 'express';
import { analyticsService } from '@rt-muban/shared/src/analytics/service';
import logger from '@rt-muban/shared/src/utils/logger';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get complete dashboard metrics
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'Dashboard metrics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get dashboard metrics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve dashboard metrics',
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/analytics/stats
 * Get overall statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get statistics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve statistics',
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/analytics/alerts
 * Get alert statistics
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alertStats = await analyticsService.getAlertStats();
    
    res.json({
      success: true,
      data: alertStats,
      message: 'Alert statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get alert statistics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve alert statistics',
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/analytics/orders
 * Get order statistics
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orderStats = await analyticsService.getOrderStats();
    
    res.json({
      success: true,
      data: orderStats,
      message: 'Order statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get order statistics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve order statistics',
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/analytics/deposits
 * Get deposit statistics
 */
router.get('/deposits', async (req: Request, res: Response) => {
  try {
    const depositStats = await analyticsService.getDepositStats();
    
    res.json({
      success: true,
      data: depositStats,
      message: 'Deposit statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get deposit statistics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve deposit statistics',
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/analytics/patrols
 * Get patrol statistics
 */
router.get('/patrols', async (req: Request, res: Response) => {
  try {
    const patrolStats = await analyticsService.getPatrolStats();
    
    res.json({
      success: true,
      data: patrolStats,
      message: 'Patrol statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get patrol statistics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve patrol statistics',
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
