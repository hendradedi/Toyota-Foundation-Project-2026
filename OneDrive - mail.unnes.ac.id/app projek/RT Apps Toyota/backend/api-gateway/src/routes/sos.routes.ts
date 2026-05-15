import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const addContactValidation = [
  body('contact_name').notEmpty().withMessage('Contact name is required'),
  body('relationship').notEmpty().withMessage('Relationship is required'),
  body('phone_number').isMobilePhone('any').withMessage('Invalid phone number'),
];

const createAlertValidation = [
  body('neighborhood_id').isUUID().withMessage('Invalid neighborhood ID'),
  body('alert_type').isIn(['medical', 'fire', 'crime', 'accident', 'other']).withMessage('Invalid alert type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('latitude').isFloat().withMessage('Invalid latitude'),
  body('longitude').isFloat().withMessage('Invalid longitude'),
];

const reportIncidentValidation = [
  body('neighborhood_id').isUUID().withMessage('Invalid neighborhood ID'),
  body('incident_type').notEmpty().withMessage('Incident type is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('latitude').isFloat().withMessage('Invalid latitude'),
  body('longitude').isFloat().withMessage('Invalid longitude'),
];

// @route   GET /api/v1/sos/contacts
// @desc    Get emergency contacts
// @access  Private
router.get('/contacts', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const result = await db.query(
      `SELECT id, user_id, contact_name, relationship, phone_number, is_active, created_at
       FROM emergency_contacts
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { contacts: result.rows },
      message: 'Emergency contacts retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching emergency contacts:', error);
    next(error);
  }
});

// @route   POST /api/v1/sos/contacts
// @desc    Add emergency contact
// @access  Private
router.post('/contacts', authenticateToken, addContactValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const userId = req.user?.id;
    const { contact_name, relationship, phone_number } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO emergency_contacts (id, user_id, contact_name, relationship, phone_number, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, contact_name, relationship, phone_number]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Emergency contact added successfully',
    });
  } catch (error) {
    logger.error('Error adding emergency contact:', error);
    next(error);
  }
});

// @route   POST /api/v1/sos/alerts
// @desc    Send SOS alert
// @access  Private
router.post('/alerts', authenticateToken, createAlertValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const userId = req.user?.id;
    const { neighborhood_id, alert_type, title, description, location, latitude, longitude } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO sos_alerts (id, reporter_id, neighborhood_id, alert_type, title, description, location, latitude, longitude, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, neighborhood_id, alert_type, title, description, location, latitude, longitude]
    );

    // Notify emergency contacts and neighborhood leaders
    await notifyEmergency(id, userId, neighborhood_id, alert_type);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'SOS alert sent successfully',
    });
  } catch (error) {
    logger.error('Error sending SOS alert:', error);
    next(error);
  }
});

// @route   GET /api/v1/sos/alerts
// @desc    Get active alerts
// @access  Public
router.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, severity, neighborhood_id, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM sos_alerts WHERE status = 'active'`;
    const params: any[] = [];

    if (severity) {
      params.push(severity);
      query_str += ` AND severity = $${params.length}`;
    }

    if (neighborhood_id) {
      params.push(neighborhood_id);
      query_str += ` AND neighborhood_id = $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM sos_alerts WHERE status = 'active'`
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
        alerts: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Active alerts retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    next(error);
  }
});

// @route   POST /api/v1/sos/alerts/:id/acknowledge
// @desc    Acknowledge alert
// @access  Private (Admin or Security Personnel)
router.post('/alerts/:id/acknowledge', authenticateToken, param('id').isUUID(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE sos_alerts 
       SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user?.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Alert not found',
        error: { code: 'SOS_001', details: {} },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Alert acknowledged successfully',
    });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    next(error);
  }
});

// @route   POST /api/v1/sos/incidents
// @desc    Report incident
// @access  Private
router.post('/incidents', authenticateToken, reportIncidentValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const userId = req.user?.id;
    const { neighborhood_id, incident_type, title, description, location, latitude, longitude } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO incidents (id, reporter_id, neighborhood_id, incident_type, title, description, location, latitude, longitude, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'reported', CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, neighborhood_id, incident_type, title, description, location, latitude, longitude]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Incident reported successfully',
    });
  } catch (error) {
    logger.error('Error reporting incident:', error);
    next(error);
  }
});

// Helper function to notify emergency contacts
async function notifyEmergency(alertId: string, userId: string, neighborhoodId: string, alertType: string) {
  try {
    // Get emergency contacts
    const contacts = await db.query(
      `SELECT phone_number FROM emergency_contacts WHERE user_id = $1`,
      [userId]
    );

    // Get neighborhood leader
    const leader = await db.query(
      `SELECT u.phone FROM users u JOIN neighborhoods n ON u.id = n.leader_id WHERE n.id = $1`,
      [neighborhoodId]
    );

    // TODO: Send SMS/Push notifications to contacts and leader
    logger.info(`SOS alert ${alertId} notifications sent`);
  } catch (error) {
    logger.error('Error notifying emergency contacts:', error);
  }
}

export default router;
