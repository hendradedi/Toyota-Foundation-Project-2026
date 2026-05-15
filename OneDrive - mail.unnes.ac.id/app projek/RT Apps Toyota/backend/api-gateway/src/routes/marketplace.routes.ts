import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const createBusinessValidation = [
  body('business_name').notEmpty().withMessage('Business name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('phone_number').isMobilePhone('any').withMessage('Invalid phone number'),
  body('address').notEmpty().withMessage('Address is required'),
];

const createProductValidation = [
  body('business_id').isUUID().withMessage('Invalid business ID'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be greater than 0'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be non-negative'),
];

const createOrderValidation = [
  body('seller_id').isUUID().withMessage('Invalid seller ID'),
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.product_id').isUUID().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('delivery_address').notEmpty().withMessage('Delivery address is required'),
];

const createReviewValidation = [
  body('business_id').isUUID().withMessage('Invalid business ID'),
  body('product_id').isUUID().withMessage('Invalid product ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Comment is required'),
];

// @route   GET /api/v1/marketplace/businesses
// @desc    Get all businesses
// @access  Public
router.get('/businesses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhood_id, category, search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM businesses WHERE is_active = true`;
    const params: any[] = [];

    if (neighborhood_id) {
      params.push(neighborhood_id);
      query_str += ` AND neighborhood_id = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query_str += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query_str += ` AND (business_name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM businesses WHERE is_active = true`
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      query_str + ` ORDER BY business_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        businesses: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Businesses retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching businesses:', error);
    next(error);
  }
});

// @route   GET /api/v1/marketplace/businesses/:id
// @desc    Get business details
// @access  Public
router.get('/businesses/:id', param('id').isUUID().withMessage('Invalid business ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM businesses WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Business not found',
        error: { code: 'BIZ_001', details: {} },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Business retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching business:', error);
    next(error);
  }
});

// @route   POST /api/v1/marketplace/businesses
// @desc    Create business
// @access  Private (Resident or Business Owner)
router.post('/businesses', authenticateToken, createBusinessValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { business_name, description, category, phone_number, address, neighborhood_id } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO businesses (id, owner_id, neighborhood_id, business_name, description, category, phone_number, address, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, req.user?.id, neighborhood_id, business_name, description, category, phone_number, address]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Business created successfully',
    });
  } catch (error) {
    logger.error('Error creating business:', error);
    next(error);
  }
});

// @route   GET /api/v1/marketplace/products
// @desc    Get all products
// @access  Public
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { business_id, category, search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM products WHERE is_active = true`;
    const params: any[] = [];

    if (business_id) {
      params.push(business_id);
      query_str += ` AND business_id = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query_str += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query_str += ` AND name ILIKE $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM products WHERE is_active = true`
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      query_str + ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
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
    logger.error('Error fetching products:', error);
    next(error);
  }
});

// @route   POST /api/v1/marketplace/products
// @desc    Create product
// @access  Private (Business Owner)
router.post('/products', authenticateToken, authorizeRole(['business_owner']), createProductValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { business_id, name, description, category, price, stock_quantity } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO products (id, business_id, name, description, category, price, stock_quantity, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, business_id, name, description, category, price, stock_quantity]
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

// @route   POST /api/v1/marketplace/orders
// @desc    Create order
// @access  Private
router.post('/orders', authenticateToken, createOrderValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { seller_id, items, delivery_address } = req.body;
    const orderId = uuidv4();

    // Calculate total
    let totalPrice = 0;
    for (const item of items) {
      const result = await db.query(
        `SELECT price FROM products WHERE id = $1`,
        [item.product_id]
      );
      if (result.rows.length > 0) {
        totalPrice += result.rows[0].price * item.quantity;
      }
    }

    // Create order
    const orderResult = await db.query(
      `INSERT INTO orders (id, buyer_id, seller_id, total_price, status, delivery_address, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [orderId, req.user?.id, seller_id, totalPrice, delivery_address]
    );

    // Insert order items
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price, created_at)
         SELECT $1, $2, id, $3, price, CURRENT_TIMESTAMP
         FROM products WHERE id = $4`,
        [uuidv4(), orderId, item.quantity, item.product_id]
      );
    }

    return res.status(201).json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
});

// @route   GET /api/v1/marketplace/orders
// @desc    Get user orders
// @access  Private
router.get('/orders', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM orders WHERE buyer_id = $1`;
    const params: any[] = [req.user?.id];

    if (status) {
      params.push(status);
      query_str += ` AND status = $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM orders WHERE buyer_id = $1`,
      [req.user?.id]
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
        orders: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Orders retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    next(error);
  }
});

// @route   POST /api/v1/marketplace/reviews
// @desc    Leave review
// @access  Private
router.post('/reviews', authenticateToken, createReviewValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { business_id, product_id, rating, comment } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO reviews (id, reviewer_id, business_id, product_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, req.user?.id, business_id, product_id, rating, comment]
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

export default router;
