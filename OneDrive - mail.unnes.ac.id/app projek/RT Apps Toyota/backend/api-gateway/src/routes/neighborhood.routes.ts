import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const createNeighborhoodValidation = [
  body('name').notEmpty().withMessage('Neighborhood name is required'),
  body('type').isIn(['RT', 'Muban']).withMessage('Type must be RT or Muban'),
  body('country').notEmpty().withMessage('Country is required'),
  body('province').optional().notEmpty(),
  body('city').optional().notEmpty(),
  body('district').optional().notEmpty(),
  body('sub_district').optional().notEmpty(),
  body('postal_code').optional(),
  body('latitude').optional().isFloat().withMessage('Invalid latitude'),
  body('longitude').optional().isFloat().withMessage('Invalid longitude'),
];

const updateNeighborhoodValidation = [
  body('name').optional().notEmpty(),
  body('type').optional().isIn(['RT', 'Muban']),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('description').optional(),
];

const createAnnouncementValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isIn(['general', 'event', 'warning', 'urgent']).withMessage('Invalid category'),
  body('priority').isIn(['low', 'normal', 'high']).withMessage('Invalid priority'),
  body('published_at').optional().isISO8601().withMessage('Invalid date format'),
];

// @route   GET /api/v1/neighborhoods
// @desc    Get all neighborhoods
// @access  Public
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, type, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM neighborhoods WHERE is_active = true`;
    const params: any[] = [];

    if (country) {
      params.push(country);
      query_str += ` AND country = $${params.length}`;
    }

    if (type) {
      params.push(type);
      query_str += ` AND type = $${params.length}`;
    }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM neighborhoods WHERE is_active = true`);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      query_str + ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        neighborhoods: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
      message: 'Neighborhoods retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching neighborhoods:', error);
    next(error);
  }
});

// @route   GET /api/v1/neighborhoods/:id
// @desc    Get neighborhood details
// @access  Public
router.get('/:id', param('id').isUUID().withMessage('Invalid neighborhood ID'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM neighborhoods WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Neighborhood not found',
        error: { code: 'NEIGH_001', details: {} },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Neighborhood retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching neighborhood:', error);
    next(error);
  }
});

// @route   POST /api/v1/neighborhoods
// @desc    Create new neighborhood
// @access  Private (Admin or RT Leader)
router.post('/', authenticateToken, authorizeRole(['admin', 'rt_leader']), createNeighborhoodValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const {
      name, type, country, province, city, district, sub_district, postal_code, latitude, longitude, description,
    } = req.body;

    const id = uuidv4();
    const result = await db.query(
      `INSERT INTO neighborhoods 
        (id, name, type, country, province, city, district, sub_district, postal_code, latitude, longitude, description, leader_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
       RETURNING *`,
      [id, name, type, country, province, city, district, sub_district, postal_code, latitude, longitude, description, req.user?.id]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Neighborhood created successfully',
    });
  } catch (error) {
    logger.error('Error creating neighborhood:', error);
    next(error);
  }
});

// @route   PUT /api/v1/neighborhoods/:id
// @desc    Update neighborhood
// @access  Private (Admin or RT Leader)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'rt_leader']), param('id').isUUID(), updateNeighborhoodValidation, async (req: Request, res: Response, next: NextFunction) => {
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
    const { name, type, latitude, longitude, description } = req.body;

    const result = await db.query(
      `UPDATE neighborhoods 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude),
           description = COALESCE($5, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND is_active = true
       RETURNING *`,
      [name || null, type || null, latitude || null, longitude || null, description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Neighborhood not found',
        error: { code: 'NEIGH_001', details: {} },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Neighborhood updated successfully',
    });
  } catch (error) {
    logger.error('Error updating neighborhood:', error);
    next(error);
  }
});

// @route   GET /api/v1/neighborhoods/:id/announcements
// @desc    Get neighborhood announcements
// @access  Public
router.get('/:id/announcements', param('id').isUUID(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, category } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM announcements WHERE neighborhood_id = $1`;
    const params: any[] = [id];

    if (category) {
      params.push(category);
      query_str += ` AND category = $${params.length}`;
    }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM announcements WHERE neighborhood_id = $1`, [id]);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      query_str + ` ORDER BY published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        announcements: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Announcements retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    next(error);
  }
});

// @route   POST /api/v1/neighborhoods/:id/announcements
// @desc    Create announcement
// @access  Private (Admin or RT Leader)
router.post('/:id/announcements', authenticateToken, authorizeRole(['admin', 'rt_leader']), param('id').isUUID(), createAnnouncementValidation, async (req: Request, res: Response, next: NextFunction) => {
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
    const { title, content, category, priority, published_at } = req.body;

    const announcementId = uuidv4();
    const result = await db.query(
      `INSERT INTO announcements (id, neighborhood_id, title, content, category, priority, published_at, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING *`,
      [announcementId, id, title, content, category, priority, published_at || new Date(), req.user?.id]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Announcement created successfully',
    });
  } catch (error) {
    logger.error('Error creating announcement:', error);
    next(error);
  }
});

export default router;
