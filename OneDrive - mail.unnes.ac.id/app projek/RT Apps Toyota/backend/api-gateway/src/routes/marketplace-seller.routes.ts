import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Middleware to verify seller owns the business
const verifyBusinessOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;

    const result = await db.query(
      `SELECT owner_id FROM businesses WHERE id = $1`,
      [businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Business not found',
        error: { code: 'BIZ_001', details: {} },
      });
    }

    if (result.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Unauthorized: You do not own this business',
        error: { code: 'AUTH_003', details: {} },
      });
    }

    next();
  } catch (error) {
    logger.error('Error verifying business ownership:', error);
    next(error);
  }
};

// @route   GET /api/v1/marketplace/seller/dashboard/:businessId
// @desc    Get seller dashboard data
// @access  Private (Business Owner)
router.get(
  '/dashboard/:businessId',
  authenticateToken,
  authorizeRole(['business_owner']),
  verifyBusinessOwnership,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params;
      const { period = '7' } = req.query; // days
      const days = parseInt(period as string) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get business info
      const businessResult = await db.query(
        `SELECT * FROM businesses WHERE id = $1`,
        [businessId]
      );

      if (businessResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Business not found',
        });
      }

      const business = businessResult.rows[0];

      // Get total revenue
      const revenueResult = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total_revenue
         FROM orders 
         WHERE seller_id = $1 AND created_at >= $2 AND status != 'cancelled'`,
        [req.user?.id, startDate]
      );

      // Get pending orders count
      const pendingResult = await db.query(
        `SELECT COUNT(*) as count FROM orders 
         WHERE seller_id = $1 AND status = 'pending'`,
        [req.user?.id]
      );

      // Get total products
      const productsResult = await db.query(
        `SELECT COUNT(*) as count FROM products 
         WHERE business_id = $1 AND deleted_at IS NULL`,
        [businessId]
      );

      // Get low stock products
      const lowStockResult = await db.query(
        `SELECT id, name, stock_quantity FROM products 
         WHERE business_id = $1 AND stock_quantity < 10 AND deleted_at IS NULL
         ORDER BY stock_quantity ASC
         LIMIT 5`,
        [businessId]
      );

      // Get recent orders
      const recentOrdersResult = await db.query(
        `SELECT o.*, u.first_name, u.last_name, u.email
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.seller_id = $1
         ORDER BY o.created_at DESC
         LIMIT 10`,
        [req.user?.id]
      );

      // Get analytics data
      const analyticsResult = await db.query(
        `SELECT date, total_orders, total_revenue, total_products_sold
         FROM seller_analytics
         WHERE business_id = $1 AND date >= $2
         ORDER BY date DESC`,
        [businessId, startDate.toISOString().split('T')[0]]
      );

      return res.status(200).json({
        success: true,
        data: {
          business,
          stats: {
            totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
            pendingOrders: parseInt(pendingResult.rows[0].count),
            totalProducts: parseInt(productsResult.rows[0].count),
          },
          lowStockProducts: lowStockResult.rows,
          recentOrders: recentOrdersResult.rows,
          analytics: analyticsResult.rows,
        },
        message: 'Dashboard data retrieved successfully',
      });
    } catch (error) {
      logger.error('Error fetching dashboard:', error);
      next(error);
    }
  }
);

// @route   GET /api/v1/marketplace/seller/products/:businessId
// @desc    Get seller's products
// @access  Private (Business Owner)
router.get(
  '/products/:businessId',
  authenticateToken,
  authorizeRole(['business_owner']),
  verifyBusinessOwnership,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params;
      const { page = 1, limit = 20, search, category } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offset = (pageNum - 1) * limitNum;

      let query_str = `SELECT * FROM products WHERE business_id = $1 AND deleted_at IS NULL`;
      const params: any[] = [businessId];

      if (search) {
        params.push(`%${search}%`);
        query_str += ` AND name ILIKE $${params.length}`;
      }

      if (category) {
        params.push(category);
        query_str += ` AND category = $${params.length}`;
      }

      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM products WHERE business_id = $1 AND deleted_at IS NULL`,
        [businessId]
      );
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limitNum);

      const result = await db.query(
        query_str + ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limitNum, offset]
      );

      return res.status(200).json({
        success: true,
        data: {
          products: result.rows,
          pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
        },
        message: 'Products retrieved successfully',
      });
    } catch (error) {
      logger.error('Error fetching seller products:', error);
      next(error);
    }
  }
);

// @route   GET /api/v1/marketplace/seller/orders/:businessId
// @desc    Get seller's orders
// @access  Private (Business Owner)
router.get(
  '/orders/:businessId',
  authenticateToken,
  authorizeRole(['business_owner']),
  verifyBusinessOwnership,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offset = (pageNum - 1) * limitNum;

      let query_str = `SELECT o.*, u.first_name, u.last_name, u.email, u.phone
                       FROM orders o
                       JOIN users u ON o.buyer_id = u.id
                       WHERE o.seller_id = $1`;
      const params: any[] = [req.user?.id];

      if (status) {
        params.push(status);
        query_str += ` AND o.status = $${params.length}`;
      }

      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM orders WHERE seller_id = $1`,
        [req.user?.id]
      );
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limitNum);

      const result = await db.query(
        query_str + ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limitNum, offset]
      );

      return res.status(200).json({
        success: true,
        data: {
          orders: result.rows,
          pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
        },
        message: 'Orders retrieved successfully',
      });
    } catch (error) {
      logger.error('Error fetching seller orders:', error);
      next(error);
    }
  }
);

// @route   PATCH /api/v1/marketplace/seller/orders/:orderId/status
// @desc    Update order status (seller action)
// @access  Private (Business Owner)
router.patch(
  '/orders/:orderId/status',
  authenticateToken,
  authorizeRole(['business_owner']),
  body('status').isIn(['confirmed', 'processing', 'shipped', 'delivered']).withMessage('Invalid status'),
  body('trackingNumber').optional().isString(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation error',
          error: { code: 'VALID_001', details: errors.array() },
        });
      }

      const { orderId } = req.params;
      const { status, trackingNumber } = req.body;

      // Verify seller owns this order
      const orderResult = await db.query(
        `SELECT * FROM orders WHERE id = $1 AND seller_id = $2`,
        [orderId, req.user?.id]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Order not found',
        });
      }

      const order = orderResult.rows[0];

      // Validate status transition
      const validTransitions: { [key: string]: string[] } = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: [],
      };

      if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `Cannot transition from ${order.status} to ${status}`,
          error: { code: 'ORDER_001', details: {} },
        });
      }

      // Update order
      const updateQuery = `
        UPDATE orders 
        SET status = $1, 
            ${status === 'confirmed' ? 'confirmed_at = CURRENT_TIMESTAMP,' : ''}
            ${status === 'shipped' ? 'shipped_at = CURRENT_TIMESTAMP,' : ''}
            ${status === 'delivered' ? 'delivered_at = CURRENT_TIMESTAMP,' : ''}
            ${trackingNumber ? 'tracking_number = $3,' : ''}
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const params = [status, orderId];
      if (trackingNumber) params.push(trackingNumber);

      const result = await db.query(updateQuery, params);

      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Order status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating order status:', error);
      next(error);
    }
  }
);

// @route   GET /api/v1/marketplace/seller/analytics/:businessId
// @desc    Get seller analytics
// @access  Private (Business Owner)
router.get(
  '/analytics/:businessId',
  authenticateToken,
  authorizeRole(['business_owner']),
  verifyBusinessOwnership,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params;
      const { period = '30' } = req.query; // days
      const days = parseInt(period as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db.query(
        `SELECT date, total_orders, total_revenue, total_products_sold, new_customers
         FROM seller_analytics
         WHERE business_id = $1 AND date >= $2
         ORDER BY date ASC`,
        [businessId, startDate.toISOString().split('T')[0]]
      );

      // Calculate summary stats
      const summaryResult = await db.query(
        `SELECT 
           SUM(total_orders) as total_orders,
           SUM(total_revenue) as total_revenue,
           SUM(total_products_sold) as total_products_sold,
           SUM(new_customers) as new_customers
         FROM seller_analytics
         WHERE business_id = $1 AND date >= $2`,
        [businessId, startDate.toISOString().split('T')[0]]
      );

      return res.status(200).json({
        success: true,
        data: {
          analytics: result.rows,
          summary: summaryResult.rows[0],
          period: days,
        },
        message: 'Analytics retrieved successfully',
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      next(error);
    }
  }
);

// @route   PATCH /api/v1/marketplace/seller/business/:businessId
// @desc    Update business profile
// @access  Private (Business Owner)
router.patch(
  '/business/:businessId',
  authenticateToken,
  authorizeRole(['business_owner']),
  verifyBusinessOwnership,
  body('business_name').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('phone_number').optional().isMobilePhone('any'),
  body('min_order_amount').optional().isFloat({ min: 0 }),
  body('delivery_options').optional().isArray(),
  body('operating_schedule').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation error',
          error: { code: 'VALID_001', details: errors.array() },
        });
      }

      const { businessId } = req.params;
      const { business_name, description, phone_number, min_order_amount, delivery_options, operating_schedule } = req.body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (business_name) {
        updates.push(`business_name = $${paramIndex++}`);
        params.push(business_name);
      }
      if (description) {
        updates.push(`description = $${paramIndex++}`);
        params.push(description);
      }
      if (phone_number) {
        updates.push(`phone_number = $${paramIndex++}`);
        params.push(phone_number);
      }
      if (min_order_amount !== undefined) {
        updates.push(`min_order_amount = $${paramIndex++}`);
        params.push(min_order_amount);
      }
      if (delivery_options) {
        updates.push(`delivery_options = $${paramIndex++}`);
        params.push(JSON.stringify(delivery_options));
      }
      if (operating_schedule) {
        updates.push(`operating_schedule = $${paramIndex++}`);
        params.push(JSON.stringify(operating_schedule));
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'No fields to update',
        });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(businessId);

      const result = await db.query(
        `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );

      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Business updated successfully',
      });
    } catch (error) {
      logger.error('Error updating business:', error);
      next(error);
    }
  }
);

export default router;
