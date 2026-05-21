import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const createApplicationValidation = [
  body('shop_name').notEmpty().withMessage('Shop name is required'),
  body('business_ownership_type').isIn(['personal', 'family', 'partner']).withMessage('Invalid ownership type'),
  body('opening_date').isISO8601().withMessage('Invalid opening date'),
];

const createProductValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('condition').isIn(['new', 'good', 'fair', 'excellent']).withMessage('Invalid product condition'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be greater than 0'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be non-negative'),
];

const updateWarungValidation = [
  body('shop_name').optional().notEmpty().withMessage('Shop name is required if updated'),
  body('category').optional().isIn(['clothing', 'food', 'electronics', 'household', 'other']).withMessage('Invalid category'),
  body('community_scope').optional().isIn(['rt_only', 'community', 'all_rt']).withMessage('Invalid community scope'),
];

// @route   GET /api/v1/warungs/applications
// @desc    Get warung applications for RT leader to review
// @access  Private (RT Leader)
router.get('/applications', authenticateToken, authorizeRole(['rt_leader']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhood_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = (page - 1) * limit;

    let query_str = `SELECT * FROM warung_applications WHERE status = 'submitted'`;
    const params: any[] = [];

    if (neighborhood_id) {
      params.push(neighborhood_id);
      query_str += ` AND applicant_neighborhood_id = $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM warung_applications WHERE status = 'submitted'`
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    const result = await db.query(
      query_str + ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        applications: result.rows,
        pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
      },
      message: 'Applications retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching applications:', error);
    next(error);
  }
});

// @route   POST /api/v1/warungs/applications
// @desc    Create new warung application
// @access  Private (Resident)
router.post('/applications', authenticateToken, createApplicationValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { shop_name, category, description, opening_date, documentation } = req.body;

    const applicationNumber = `WAR-2026-${uuidv4().substring(0, 8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const result = await db.query(
      `INSERT INTO warung_applications 
       (id, applicant_id, applicant_neighborhood_id, application_number, shop_name, 
        category, description, business_ownership_type, opening_date, 
        documentation, status, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'personal', $8, $9, 'submitted', $10, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        uuidv4(),
        (req as any).user?.id,
        (req as any).user?.id, // Assuming user's household is linked to user_id for now
        applicationNumber,
        shop_name,
        category,
        description,
        opening_date,
        documentation,
        expiresAt,
      ]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Application created successfully',
    });
  } catch (error) {
    logger.error('Error creating application:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs
// @desc    Get all warungs (public)
// @access  Public
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scope = 'all_rt', neighborhood_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = (page - 1) * limit;

    let query_str = `
      SELECT w.*,
             (SELECT COUNT(*) FROM warung_reviews WHERE warung_id = w.id) as review_count,
             (SELECT AVG(CAST(rating AS numeric)) FROM warung_reviews WHERE warung_id = w.id) as avg_rating
       FROM warungs w
       WHERE w.is_active = true
         AND w.approval_status = 'approved'
         AND w.validity_end_date >= CURRENT_DATE
    `;
    const params: any[] = [];

    if (scope === 'rt_only' && neighborhood_id) {
      query_str += ` AND w.neighborhood_id = $${params.length + 1}`;
      params.push(neighborhood_id);
    } else if (scope === 'community' && neighborhood_id) {
      query_str += ` AND w.neighborhood_id = $${params.length + 1}`;
      params.push(neighborhood_id);
    }

    query_str += ` ORDER BY w.shop_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const result = await db.query(query_str, [...params, limit, offset]);

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM warungs WHERE is_active = true AND approval_status = 'approved' AND validity_end_date >= CURRENT_DATE`
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        warungs: result.rows,
        pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
      },
      message: 'Warungs retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching warungs:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/:id
// @desc    Get warung details
// @access  Public
router.get('/:id', param('id').isUUID().withMessage('Invalid warung ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT w.*,
             (SELECT COUNT(*) FROM warung_reviews WHERE warung_id = w.id) as review_count,
             (SELECT AVG(CAST(rating AS numeric)) FROM warung_reviews WHERE warung_id = w.id) as avg_rating
       FROM warungs w
       WHERE w.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Warung not found',
        error: { code: 'WARG_001', details: {} },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Warung retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching warung:', error);
    next(error);
  }
});

// @route   POST /api/v1/warungs/approval
// @desc    Approve or reject warung application
// @access  Private (RT Leader)
router.post('/approval', authenticateToken, authorizeRole(['rt_leader']), async (req: Request, res: Response, next: NextFunction) => {
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

    const { application_number, decision, reason } = req.body;

    // Get application
    const appResult = await db.query(
      `SELECT * FROM warung_applications WHERE application_number = $1 AND status = 'submitted'`,
      [application_number]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Application not found',
        error: { code: 'WARG_003', details: {} },
      });
    }

    const application = appResult.rows[0];
    let warung;

    if (decision === 'approve') {
      // Calculate validity period (1 year)
      const now = new Date();
      const validityStart = new Date(now);
      const validityEnd = new Date(now);
      validityEnd.setFullYear(validityEnd.getFullYear() + 1);

      // Update application status
      await db.query(
        `UPDATE warung_applications 
         SET status = 'approved', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, 
             reviewer_comments = $3
         WHERE id = $1`,
        [application.id, (req as any).user?.id, reason]
      );

      // Create warung
      const warungResult = await db.query(
        `INSERT INTO warungs 
         (id, owner_id, neighborhood_id, community_scope, shop_name, description, 
          category, status, approval_status, approval_reason, approved_by, 
          approval_date, validity_start_date, validity_end_date, operating_hours, 
          phone_number, email, address, latitude, longitude, logo_url, 
          is_active, rating, total_reviews, created_at, updated_at)
         VALUES ($1, $2, $3, 'rt_only', $4, $5, $6, 'approved', 'approved', NULL, $7, 
               $8, $9, $10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, 0, 0, 
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          uuidv4(),
          application.applicant_id,
          application.applicant_neighborhood_id,
          application.shop_name,
          application.description,
          application.category,
          (req as any).user?.id,
          now,
          validityStart,
          validityEnd,
        ]
      );

      warung = warungResult.rows[0];

      // Create approval history
      await db.query(
        `INSERT INTO warung_approval_history 
         (id, warung_id, previous_status, new_status, approval_decision, 
          decision_reason, approved_by, created_by, created_at)
         VALUES ($1, $2, 'submitted', 'approved', 'approved', $3, $4, $5, CURRENT_TIMESTAMP)`,
        [uuidv4(), warung.id, reason, (req as any).user?.id, (req as any).user?.id]
      );
    } else {
      // Reject application
      await db.query(
        `UPDATE warung_applications 
         SET status = 'rejected', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, 
             reviewer_comments = $3
         WHERE id = $1`,
        [application.id, (req as any).user?.id, reason]
      );

      warung = application;
    }

    return res.status(200).json({
      success: true,
      data: warung,
      message: decision === 'approve' ? 'Application approved successfully' : 'Application rejected successfully',
    });
  } catch (error) {
    logger.error('Error processing approval:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/my
// @desc    Get user's warungs
// @access  Private (Warung Owner)
router.get('/my', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      `SELECT w.*, 
             (SELECT COUNT(*) FROM warung_reviews WHERE warung_id = w.id) as review_count,
             (SELECT AVG(CAST(rating AS numeric)) FROM warung_reviews WHERE warung_id = w.id) as avg_rating
       FROM warungs w
       WHERE w.owner_id = $1
       ORDER BY w.created_at DESC`,
      [(req as any).user?.id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Warungs retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching user warungs:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/:id/products
// @desc    Get warung products
// @access  Public
router.get('/:id/products', param('id').isUUID().withMessage('Invalid warung ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT wp.*,
             (SELECT COUNT(*) FROM warung_reviews WHERE product_id = wp.id) as review_count,
             (SELECT AVG(CAST(rating AS numeric)) FROM warung_reviews WHERE product_id = wp.id) as avg_rating
       FROM warung_products wp
       WHERE wp.warung_id = $1
       ORDER BY wp.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    next(error);
  }
});

// @route   POST /api/v1/warungs/:id/products
// @desc    Create warung product
// @access  Private (Warung Owner)
router.post('/:id/products', authenticateToken, param('id').isUUID().withMessage('Invalid warung ID'), createProductValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { id } = req.params;

    // Check ownership
    const ownerResult = await db.query(`SELECT owner_id FROM warungs WHERE id = $1`, [id]);
    if (ownerResult.rows.length === 0 || ownerResult.rows[0].owner_id !== (req as any).user?.id) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Unauthorized',
        error: { code: 'AUTH_001', details: {} },
      });
    }

    const { name, description, category, subcategory, brand, condition, price, stock_quantity, image_url } = req.body;

    const result = await db.query(
      `INSERT INTO warung_products 
       (id, warung_id, name, description, category, subcategory, brand, condition, 
        price, currency, stock_quantity, image_url, is_available, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, 
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        uuidv4(),
        id,
        name,
        description,
        category,
        subcategory,
        brand,
        condition,
        price,
        'IDR',
        stock_quantity,
        image_url,
      ]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Product created successfully',
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/:id/products/:productId
// @desc    Get warung product detail
// @access  Public
router.get('/:id/products/:productId', param('id').isUUID().withMessage('Invalid warung ID'), param('productId').isUUID().withMessage('Invalid product ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, productId } = req.params;

    const result = await db.query(
      `SELECT * FROM warung_products WHERE id = $1 AND warung_id = $2`,
      [productId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found',
        error: { code: 'WARG_004', details: {} },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Product retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    next(error);
  }
});

// @route   PUT /api/v1/warungs/:id
// @desc    Update warung
// @access  Private (Warung Owner)
router.put('/:id', authenticateToken, updateWarungValidation, param('id').isUUID().withMessage('Invalid warung ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check ownership
    const ownerResult = await db.query(`SELECT owner_id FROM warungs WHERE id = $1`, [id]);
    if (ownerResult.rows.length === 0 || ownerResult.rows[0].owner_id !== (req as any).user?.id) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Unauthorized',
        error: { code: 'AUTH_001', details: {} },
      });
    }

    const updates: Record<string, any> = {};
    const fields = ['shop_name', 'category', 'description', 'community_scope', 'operating_hours', 'phone_number', 'email', 'address', 'is_active'];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'No valid fields to update',
        error: { code: 'VALID_002', details: {} },
      });
    }

    const setClauses = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`);
    const values = Object.values(updates);

    const result = await db.query(
      `UPDATE warungs SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Warung updated successfully',
    });
  } catch (error) {
    logger.error('Error updating warung:', error);
    next(error);
  }
});

// @route   DELETE /api/v1/warungs/:id
// @desc    Close warung
// @access  Private (Warung Owner)
router.delete('/:id', authenticateToken, param('id').isUUID().withMessage('Invalid warung ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check ownership
    const ownerResult = await db.query(`SELECT owner_id FROM warungs WHERE id = $1`, [id]);
    if (ownerResult.rows.length === 0 || ownerResult.rows[0].owner_id !== (req as any).user?.id) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Unauthorized',
        error: { code: 'AUTH_001', details: {} },
      });
    }

    await db.query(
      `UPDATE warungs SET is_active = false, status = 'inactive' WHERE id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Warung closed successfully',
    });
  } catch (error) {
    logger.error('Error closing warung:', error);
    next(error);
  }
});

// @route   POST /api/v1/warungs/orders
// @desc    Create order
// @access  Private (Buyer)
router.post('/orders', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
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

    const { warung_id, items, delivery_address } = req.body;

    // Check if warung is active
    const warungResult = await db.query(
      `SELECT * FROM warungs WHERE id = $1 AND is_active = true AND approval_status = 'approved' AND validity_end_date >= CURRENT_DATE`,
      [warung_id]
    );

    if (warungResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Warung not found or inactive',
        error: { code: 'WARG_005', details: {} },
      });
    }

    const warung = warungResult.rows[0];
    const orderNumber = `WAR-2026-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Calculate total amount and check stock
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const productResult = await db.query(
        `SELECT price, stock_quantity FROM warung_products WHERE id = $1 AND is_available = true`,
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Product not found or unavailable',
          error: { code: 'WARG_006', details: { product_id: item.product_id } },
        });
      }

      const product = productResult.rows[0];
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Insufficient stock',
          error: { code: 'WARG_007', details: { product_id: item.product_id } },
        });
      }

      totalAmount += item.quantity * product.price;

      orderItems.push({
        id: uuidv4(),
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal: item.quantity * product.price,
      });

      // Decrease stock
      await db.query(
        `UPDATE warung_products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Create order
    const orderResult = await db.query(
      `INSERT INTO warung_orders 
       (id, order_number, buyer_id, buyer_neighborhood_id, seller_warung_id, 
        seller_owner_id, total_amount, currency, status, payment_status, 
        delivery_address, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'IDR', 'pending', 'unpaid', $8, $9, 
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        uuidv4(),
        orderNumber,
        (req as any).user?.id,
        (req as any).user?.id, // buyer neighborhood id - simplified
        warung_id,
        warung.owner_id,
        totalAmount,
        delivery_address,
        req.body.notes,
      ]
    );

    // Insert order items
    for (const item of orderItems) {
      await db.query(
        `INSERT INTO warung_order_items 
         (id, order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, orderResult.rows[0].id, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );
    }

    return res.status(201).json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items: orderItems,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/orders
// @desc    Get user orders
// @access  Private (Buyer)
router.get('/orders', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    let query_str = `SELECT wo.* FROM warung_orders wo WHERE wo.buyer_id = $1`;
    const params: any[] = [(req as any).user?.id];

    if (status) {
      params.push(status);
      query_str += ` AND wo.status = $${params.length}`;
    }

    query_str += ` ORDER BY wo.created_at DESC`;

    const result = await db.query(query_str, params);

    return res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Orders retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/orders/:id
// @desc    Get order details
// @access  Private (Buyer or Seller)
router.get('/orders/:id', authenticateToken, param('id').isUUID().withMessage('Invalid order ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const orderResult = await db.query(
      `SELECT * FROM warung_orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
        error: { code: 'WARG_008', details: {} },
      });
    }

    const order = orderResult.rows[0];

    // Check if user can view this order
    const canView = order.buyer_id === (req as any).user?.id || order.seller_owner_id === (req as any).user?.id;

    if (!canView) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'You do not have permission to view this order',
        error: { code: 'WARG_009', details: {} },
      });
    }

    // Get order items
    const itemsResult = await db.query(
      `SELECT * FROM warung_order_items WHERE order_id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows,
      },
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    next(error);
  }
});

// @route   PUT /api/v1/warungs/orders/:id/status
// @desc    Update order status (seller)
// @access  Private (Seller)
router.put('/orders/:id/status', authenticateToken, authorizeRole(['business_owner', 'rt_leader']), param('id').isUUID().withMessage('Invalid order ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if seller owns this order
    const orderResult = await db.query(
      `SELECT * FROM warung_orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
        error: { code: 'WARG_008', details: {} },
      });
    }

    const order = orderResult.rows[0];

    // Check ownership
    const warungResult = await db.query(
      `SELECT owner_id FROM warungs WHERE id = $1`,
      [order.seller_warung_id]
    );

    if (warungResult.rows.length === 0 || warungResult.rows[0].owner_id !== (req as any).user?.id) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Unauthorized',
        error: { code: 'AUTH_001', details: {} },
      });
    }

    await db.query(
      `UPDATE warung_orders SET status = $1 WHERE id = $2`,
      [status, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
});

// @route   POST /api/v1/warungs/reviews
// @desc    Create review
// @access  Private (Buyer after purchase)
router.post('/reviews', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
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

    const { warung_id, product_id, rating, comment } = req.body;

    // Check if buyer has already reviewed this warung
    const existingReview = await db.query(
      `SELECT * FROM warung_reviews WHERE reviewer_id = $1 AND warung_id = $2`,
      [(req as any).user?.id, warung_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'You have already reviewed this warung',
        error: { code: 'WARG_010', details: {} },
      });
    }

    // Create review
    const result = await db.query(
      `INSERT INTO warung_reviews 
       (id, reviewer_id, warung_id, product_id, rating, comment, is_verified_purchase, 
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        uuidv4(),
        (req as any).user?.id,
        warung_id,
        product_id,
        rating,
        comment,
      ]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Review created successfully',
    });
  } catch (error) {
    logger.error('Error creating review:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/:id/reviews
// @desc    Get warung reviews
// @access  Public
router.get('/:id/reviews', param('id').isUUID().withMessage('Invalid warung ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT wr.*
       FROM warung_reviews wr
       WHERE wr.warung_id = $1
       ORDER BY wr.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Reviews retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/approval-history/:id
// @desc    Get approval history
// @access  Private (Warung Owner or RT Leader)
router.get('/approval-history/:id', authenticateToken, authorizeRole(['rt_leader', 'business_owner', 'resident']), param('id').isUUID().withMessage('Invalid warung ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM warung_approval_history WHERE warung_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Approval history retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching approval history:', error);
    next(error);
  }
});

// @route   GET /api/v1/warungs/analytics/neighborhood/:neighborhoodId
// @desc    Get neighborhood analytics
// @access  Private (RT Leader)
router.get('/analytics/neighborhood/:neighborhoodId', authenticateToken, authorizeRole(['rt_leader']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhoodId } = req.params;

    // Get analytics
    const totalResult = await db.query(
      `SELECT
        COUNT(*) as total_warungs,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as active_warungs,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approval
       FROM warungs
       WHERE neighborhood_id = $1`,
      [neighborhoodId]
    );

    const productsResult = await db.query(
      `SELECT COUNT(*) as total_products FROM warung_products wp
       JOIN warungs w ON wp.warung_id = w.id
       WHERE w.neighborhood_id = $1`,
      [neighborhoodId]
    );

    const ordersResult = await db.query(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue
       FROM warung_orders
       WHERE buyer_neighborhood_id = $1`,
      [neighborhoodId]
    );

    const ratingResult = await db.query(
      `SELECT AVG(CAST(rating AS numeric)) as average_rating FROM warung_reviews
       WHERE warung_id IN (SELECT id FROM warungs WHERE neighborhood_id = $1)`,
      [neighborhoodId]
    );

    return res.status(200).json({
      success: true,
      data: {
        total_warungs: parseInt(totalResult.rows[0].total_warungs) || 0,
        active_warungs: parseInt(totalResult.rows[0].active_warungs) || 0,
        pending_approval: parseInt(totalResult.rows[0].pending_approval) || 0,
        total_products: parseInt(productsResult.rows[0].total_products) || 0,
        total_orders: parseInt(ordersResult.rows[0].total_orders) || 0,
        total_revenue: parseFloat(ordersResult.rows[0].total_revenue) || 0,
        average_rating: parseFloat(ratingResult.rows[0].average_rating) || 0,
      },
      message: 'Analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    next(error);
  }
});

export default router;
