import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@rt-muban/shared';
import { config } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const updateProfileValidation = [
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('language_preference').optional().isIn(['id', 'th', 'en']).withMessage('Invalid language'),
];

const updateSettingsValidation = [
  body('notification_preferences').optional().isObject().withMessage('Notification preferences must be an object'),
  body('notification_preferences.email').optional().isBoolean().withMessage('Email notification must be boolean'),
  body('notification_preferences.push').optional().isBoolean().withMessage('Push notification must be boolean'),
  body('notification_preferences.sms').optional().isBoolean().withMessage('SMS notification must be boolean'),
];

// @route   GET /api/v1/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const result = await db.query(
      `SELECT id, email, first_name, last_name, phone, profile_picture_url, 
              language_preference, timezone, is_active, is_verified, 
              last_login, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found',
        error: {
          code: 'USER_001',
          details: {},
        },
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        profile_picture_url: user.profile_picture_url,
        language_preference: user.language_preference,
        timezone: user.timezone,
        is_active: user.is_active,
        is_verified: user.is_verified,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      message: 'User profile retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    next(error);
  }
});

// @route   PUT /api/v1/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, updateProfileValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation error',
        error: {
          code: 'VALID_001',
          details: errors.array(),
        },
      });
    }

    const userId = req.user?.id;
    const { first_name, last_name, phone, language_preference } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           language_preference = COALESCE($4, language_preference),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, language_preference, timezone, created_at, updated_at`,
      [first_name || null, last_name || null, phone || null, language_preference || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found',
        error: {
          code: 'USER_001',
          details: {},
        },
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        language_preference: user.language_preference,
        timezone: user.timezone,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      message: 'User profile updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    next(error);
  }
});

// @route   GET /api/v1/users/households
// @desc    Get user households
// @access  Private
router.get('/households', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM households h 
       JOIN household_members hm ON h.id = hm.household_id 
       WHERE hm.user_id = $1`,
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      `SELECT h.id, h.neighborhood_id, h.household_number, h.address, 
              h.latitude, h.longitude, h.created_at, h.updated_at,
              n.name as neighborhood_name, n.type as neighborhood_type
       FROM households h
       JOIN household_members hm ON h.id = hm.household_id
       JOIN neighborhoods n ON h.neighborhood_id = n.id
       WHERE hm.user_id = $1
       ORDER BY h.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        households: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
      message: 'User households retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching user households:', error);
    next(error);
  }
});

// @route   GET /api/v1/users/roles
// @desc    Get user roles
// @access  Private
router.get('/roles', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const result = await db.query(
      `SELECT r.id, r.name, r.description, ur.neighborhood_id, n.name as neighborhood_name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN neighborhoods n ON ur.neighborhood_id = n.id
       WHERE ur.user_id = $1
       ORDER BY r.name`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        roles: result.rows,
      },
      message: 'User roles retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching user roles:', error);
    next(error);
  }
});

// @route   PUT /api/v1/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', authenticateToken, updateSettingsValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation error',
        error: {
          code: 'VALID_001',
          details: errors.array(),
        },
      });
    }

    const userId = req.user?.id;
    const { notification_preferences } = req.body;

    // Update user_settings table (you'll need to create this table if it doesn't exist)
    const result = await db.query(
      `INSERT INTO user_settings (id, user_id, notification_preferences, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET 
         notification_preferences = $3,
         updated_at = CURRENT_TIMESTAMP
       RETURNING user_id, notification_preferences, updated_at`,
      [uuidv4(), userId, JSON.stringify(notification_preferences || {})]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'User settings updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user settings:', error);
    next(error);
  }
});

export default router;
