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
  body('schedule_name').notEmpty().withMessage('Schedule name is required'),
  body('description').optional(),
  body('start_date').isISO8601().withMessage('Invalid start date'),
  body('end_date').optional().isISO8601().withMessage('Invalid end date'),
  body('is_recurring').isBoolean().withMessage('is_recurring must be boolean'),
  body('recurrence_pattern').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid recurrence pattern'),
];

const createShiftValidation = [
  body('schedule_id').isUUID().withMessage('Invalid schedule ID'),
  body('shift_date').isISO8601().withMessage('Invalid shift date'),
  body('shift_start_time').matches(/^\d{2}:\d{2}$/).withMessage('Invalid start time format (HH:MM)'),
  body('shift_end_time').matches(/^\d{2}:\d{2}$/).withMessage('Invalid end time format (HH:MM)'),
  body('assigned_to').isUUID().withMessage('Invalid assigned officer ID'),
];

const logActivityValidation = [
  body('shift_id').isUUID().withMessage('Invalid shift ID'),
  body('patrol_officer_id').isUUID().withMessage('Invalid patrol officer ID'),
  body('location').notEmpty().withMessage('Location is required'),
  body('latitude').isFloat().withMessage('Invalid latitude'),
  body('longitude').isFloat().withMessage('Invalid longitude'),
  body('notes').notEmpty().withMessage('Notes are required'),
];

const reportIncidentValidation = [
  body('shift_id').isUUID().withMessage('Invalid shift ID'),
  body('incident_type').notEmpty().withMessage('Incident type is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('latitude').isFloat().withMessage('Invalid latitude'),
  body('longitude').isFloat().withMessage('Invalid longitude'),
];

// @route   GET /api/v1/patrol/schedules
// @desc    Get patrol schedules
// @access  Public
router.get('/schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhood_id, is_active, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT * FROM patrol_schedules WHERE 1=1`;
    const params: any[] = [];

    if (neighborhood_id) {
      params.push(neighborhood_id);
      query_str += ` AND neighborhood_id = $${params.length}`;
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query_str += ` AND is_active = $${params.length}`;
    }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM patrol_schedules`);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      query_str + ` ORDER BY start_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        schedules: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Patrol schedules retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching patrol schedules:', error);
    next(error);
  }
});

// @route   POST /api/v1/patrol/schedules
// @desc    Create patrol schedule
// @access  Private (Admin or RT Leader)
router.post('/schedules', authenticateToken, authorizeRole(['admin', 'rt_leader']), createScheduleValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { neighborhood_id, schedule_name, description, start_date, end_date, is_recurring, recurrence_pattern } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO patrol_schedules (id, neighborhood_id, schedule_name, description, start_date, end_date, is_recurring, recurrence_pattern, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, neighborhood_id, schedule_name, description, new Date(start_date), end_date ? new Date(end_date) : null, is_recurring, recurrence_pattern, req.user?.id]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Patrol schedule created successfully',
    });
  } catch (error) {
    logger.error('Error creating patrol schedule:', error);
    next(error);
  }
});

// @route   GET /api/v1/patrol/shifts
// @desc    Get patrol shifts
// @access  Public
router.get('/shifts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schedule_id, shift_date, status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    let query_str = `SELECT ps.*, u.first_name, u.last_name FROM patrol_shifts ps 
                     JOIN users u ON ps.assigned_to = u.id WHERE 1=1`;
    const params: any[] = [];

    if (schedule_id) {
      params.push(schedule_id);
      query_str += ` AND ps.schedule_id = $${params.length}`;
    }

    if (shift_date) {
      params.push(new Date(shift_date as string));
      query_str += ` AND ps.shift_date = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query_str += ` AND ps.status = $${params.length}`;
    }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM patrol_shifts`);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const result = await db.query(
      query_str + ` ORDER BY ps.shift_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        shifts: result.rows,
        pagination: { page: pageNum, limit: limitNum, total, totalPages, hasMore: pageNum < totalPages },
      },
      message: 'Patrol shifts retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching patrol shifts:', error);
    next(error);
  }
});

// @route   POST /api/v1/patrol/shifts
// @desc    Create patrol shift
// @access  Private (Admin or RT Leader)
router.post('/shifts', authenticateToken, authorizeRole(['admin', 'rt_leader']), createShiftValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { schedule_id, shift_date, shift_start_time, shift_end_time, assigned_to } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO patrol_shifts (id, schedule_id, shift_date, shift_start_time, shift_end_time, assigned_to, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, schedule_id, new Date(shift_date), shift_start_time, shift_end_time, assigned_to]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Patrol shift created successfully',
    });
  } catch (error) {
    logger.error('Error creating patrol shift:', error);
    next(error);
  }
});

// @route   POST /api/v1/patrol/logs
// @desc    Log patrol activity
// @access  Private (Security Personnel)
router.post('/logs', authenticateToken, authorizeRole(['security_personnel']), logActivityValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { shift_id, patrol_officer_id, location, latitude, longitude, notes } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO patrol_logs (id, shift_id, patrol_officer_id, location, latitude, longitude, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, shift_id, patrol_officer_id, location, latitude, longitude, notes]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Patrol activity logged successfully',
    });
  } catch (error) {
    logger.error('Error logging patrol activity:', error);
    next(error);
  }
});

// @route   POST /api/v1/patrol/incidents
// @desc    Report security incident
// @access  Private (Security Personnel)
router.post('/incidents', authenticateToken, authorizeRole(['security_personnel']), reportIncidentValidation, async (req: Request, res: Response, next: NextFunction) => {
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

    const { shift_id, incident_type, title, description, location, latitude, longitude } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO patrol_incidents (id, shift_id, reported_by, incident_type, title, description, location, latitude, longitude, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'reported', CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, shift_id, req.user?.id, incident_type, title, description, location, latitude, longitude]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Security incident reported successfully',
    });
  } catch (error) {
    logger.error('Error reporting security incident:', error);
    next(error);
  }
});

export default router;
