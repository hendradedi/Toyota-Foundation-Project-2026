import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@rt-muban/shared';
import { config } from '@rt-muban/shared';
import { generateTokenPair } from '@rt-muban/shared/src/utils/jwt';
import { hashPassword, comparePassword } from '@rt-muban/shared/src/utils/password';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @route   POST /api/v1/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALID_001',
          details: errors.array(),
        },
      });
    }

    const { email, password, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        error: {
          code: 'AUTH_004',
          details: {},
        },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await db.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, language_preference, timezone, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, first_name, last_name, phone, language_preference, created_at`,
      [
        uuidv4(),
        email,
        hashedPassword,
        first_name,
        last_name || null,
        phone || null,
        config.localization.defaultLanguage,
        config.localization.defaultTimezone,
        true,
        false,
      ]
    );

    const user = result.rows[0];

    // Assign default resident role
    await db.query(
      `INSERT INTO user_roles (id, user_id, role_id)
       SELECT $1, $2, r.id
       FROM roles r
       WHERE r.name = 'resident'`,
      [uuidv4(), user.id]
    );

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      roles: ['resident'],
    });

    // Store refresh token in database
    await db.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [
        uuidv4(),
        user.id,
        bcrypt.hashSync(tokens.refreshToken, 10),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ]
    );

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          language_preference: user.language_preference,
          roles: ['resident'],
        },
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
});

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: {
          code: 'VALID_001',
          details: errors.array(),
        },
      });
    }

    const { email, password } = req.body;

    // Find user
    const result = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, 
              u.profile_picture_url, u.language_preference, u.timezone, u.is_active, u.is_verified,
              array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: {
          code: 'AUTH_001',
          details: {},
        },
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: {
          code: 'AUTH_005',
          details: {},
        },
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: {
          code: 'AUTH_001',
          details: {},
        },
      });
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      roles: user.roles || ['resident'],
    });

    // Store refresh token in database
    await db.query(
      `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        user.id,
        bcrypt.hashSync(tokens.refreshToken, 10),
        req.ip,
        req.get('User-Agent'),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ]
    );

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          profile_picture_url: user.profile_picture_url,
          language_preference: user.language_preference,
          timezone: user.timezone,
          roles: user.roles || ['resident'],
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: {
          code: 'AUTH_006',
          details: {},
        },
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, config.jwt.refreshSecret) as any;

    // Check if token exists in database
    const sessionResult = await db.query(
      `SELECT s.id, s.user_id, s.token_hash, s.expires_at, s.revoked_at
       FROM sessions s
       WHERE s.user_id = $1 AND s.expires_at > CURRENT_TIMESTAMP AND s.revoked_at IS NULL`,
      [decoded.userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: {
          code: 'AUTH_002',
          details: {},
        },
      });
    }

    // Get user with roles
    const userResult = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, 
              u.profile_picture_url, u.language_preference, u.timezone,
              array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [decoded.userId]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: {
          code: 'NOT_FOUND_002',
          details: {},
        },
      });
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      roles: user.roles || ['resident'],
    });

    // Revoke old session
    await db.query(
      'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1',
      [sessionResult.rows[0].id]
    );

    // Store new refresh token
    await db.query(
      `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        user.id,
        bcrypt.hashSync(tokens.refreshToken, 10),
        req.ip,
        req.get('User-Agent'),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ]
    );

    res.json({
      success: true,
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          profile_picture_url: user.profile_picture_url,
          language_preference: user.language_preference,
          timezone: user.timezone,
          roles: user.roles || ['resident'],
        },
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: {
          code: 'AUTH_003',
          details: {},
        },
      });
    }
    
    next(error);
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'No token provided',
        error: {
          code: 'AUTH_007',
          details: {},
        },
      });
    }

    // Revoke all sessions for this user
    await db.query(
      'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );

    res.json({
      success: true,
      data: null,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
});

// @route   GET /api/v1/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'No token provided',
        error: {
          code: 'AUTH_007',
          details: {},
        },
      });
    }

    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, 
              u.profile_picture_url, u.language_preference, u.timezone, u.is_active, u.is_verified,
              u.last_login, u.created_at, u.updated_at,
              array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found',
        error: {
          code: 'NOT_FOUND_002',
          details: {},
        },
      });
    }

    const user = result.rows[0];

    res.json({
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
        roles: user.roles || [],
      },
      message: 'Current user retrieved successfully',
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: {
          code: 'AUTH_003',
          details: {},
        },
      });
    }
    
    next(error);
  }
});

export default router;
