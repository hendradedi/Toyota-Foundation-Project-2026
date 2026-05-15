import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const createScheduleValidation = [
  body('neighborhood_id').isUUID().withMessage('Invalid neighborhood ID'),
  body('collection_date').isISO8601().withMessage('Invalid collection date'),
  body('collection_time').matches(/^\d{2}:\d{2}$/).withMessage('Invalid time format (HH:MM)'),
  body('location').notEmpty().withMessage('Location is required'),
];

const recordDepositValidation = [
  body('waste_category_id').isUUID().withMessage('Invalid waste category ID'),
  body('quantity').isFloat({ min: 0.1 }).withMessage('Quantity must be greater than 0'),
  body('collection_id').isUUID().withMessage('Invalid collection ID'),
];

const createRecyclingCenterValidation = [
  body('name').notEmpty().withMessage('Center name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('phone').optional().isMobilePhone('any'),
  body('latitude').isFloat().withMessage('Invalid latitude'),
  body('longitude').isFloat().withMessage('Invalid longitude'),
];

// @route   GET /api/v1/waste-bank/categories
// @desc    Get waste categories
// @access  Public
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, unit, value_per_unit, is_active
       FROM waste_categories
       WHERE is_active = true
       ORDER BY name ASC`
    );

    return res.status(200).json({
      success: true,
      data: { categories: result.rows },
      message: 'Waste categories retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching waste categories:', error);
    next(error);
  }
});

// @route   GET /api/v1/waste-bank/schedule
// @desc    Get waste collection schedule
// @access  Public
router.get('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhood_id, date_from, date_to, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM waste_collection_schedules WHERE is_active = true`;
    const params: any[] = [];

    if (neighborhood_id) {
      params.push(neighborhood_id);
      query_str += ` AND neighborhood_id = $${params.length}`;
    }

    if (date_from) {
      params.push(new Date(date_from as string));
      query_str += ` AND collection_date >= $${params.length}`;
    }

    if (date_to) {
      params.push(new Date(date_to as string));
      query_str += ` AND collection_date <= $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM waste_collection_schedules WHERE is_active = true`
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      query_str + ` ORDER BY collection_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        schedules: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Collection schedules retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching collection schedules:', error);
    next(error);
  }
});

// @route   POST /api/v1/waste-bank/schedule
// @desc    Create waste collection schedule
// @access  Private (Admin or Waste Collector)
router.post('/schedule', authenticateToken, authorizeRole(['admin', 'waste_collector']), createScheduleValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { neighborhood_id, collection_date, collection_time, location } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO waste_collection_schedules (id, neighborhood_id, collection_date, collection_time, location, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, true, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, neighborhood_id, new Date(collection_date), collection_time, location, req.user?.id]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Collection schedule created successfully',
    });
  } catch (error) {
    logger.error('Error creating collection schedule:', error);
    next(error);
  }
});

// @route   POST /api/v1/waste-bank/deposit
// @desc    Record waste deposit
// @access  Private
router.post('/deposit', authenticateToken, recordDepositValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { waste_category_id, quantity, collection_id } = req.body;
    const userId = req.user?.id;
    const id = uuidv4();

    // Get waste category value
    const categoryResult = await db.query(
      `SELECT value_per_unit FROM waste_categories WHERE id = $1`,
      [waste_category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Waste category not found',
        error: { code: 'WASTE_001', details: {} },
      });
    }

    const valuePerUnit = categoryResult.rows[0].value_per_unit;
    const totalPoints = quantity * valuePerUnit;

    // Record deposit
    const result = await db.query(
      `INSERT INTO waste_deposits (id, user_id, waste_category_id, quantity, total_points, collection_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, waste_category_id, quantity, totalPoints, collection_id]
    );

    // Update user points
    await db.query(
      `UPDATE user_points SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [totalPoints, userId]
    );

    return res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        points_earned: totalPoints,
      },
      message: 'Waste deposit recorded successfully',
    });
  } catch (error) {
    logger.error('Error recording waste deposit:', error);
    next(error);
  }
});

// @route   GET /api/v1/waste-bank/points
// @desc    Get user points
// @access  Private
router.get('/points', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const result = await db.query(
      `SELECT id, user_id, balance, total_earned, total_redeemed, updated_at
       FROM user_points
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Points record not found',
        error: { code: 'POINTS_001', details: {} },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'User points retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching user points:', error);
    next(error);
  }
});

// @route   GET /api/v1/waste-bank/points/history
// @desc    Get points history
// @access  Private
router.get('/points/history', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM waste_deposits WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      `SELECT wd.id, wd.waste_category_id, wc.name as category_name, wd.quantity, wd.total_points, 
              wd.collection_id, wd.created_at
       FROM waste_deposits wd
       JOIN waste_categories wc ON wd.waste_category_id = wc.id
       WHERE wd.user_id = $1
       ORDER BY wd.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        history: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Points history retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching points history:', error);
    next(error);
  }
});

// @route   GET /api/v1/waste-bank/recycling-centers
// @desc    Get recycling centers
// @access  Public
router.get('/recycling-centers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhood_id, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM recycling_centers WHERE is_active = true`;
    const params: any[] = [];

    if (neighborhood_id) {
      params.push(neighborhood_id);
      query_str += ` AND neighborhood_id = $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM recycling_centers WHERE is_active = true`
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
        centers: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Recycling centers retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching recycling centers:', error);
    next(error);
  }
});

export default router;
