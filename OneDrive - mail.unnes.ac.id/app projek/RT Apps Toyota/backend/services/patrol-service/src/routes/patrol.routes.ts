import { Router } from 'express';
import { validate, validateQuery } from '../middleware/validation.middleware';
import {
  shiftCreationSchema,
  shiftUpdateSchema,
  shiftQuerySchema,
  shiftStatusSchema,
  patrolCheckinSchema,
  patrolReportSchema,
} from '../schemas/patrol.schema';
import {
  createShift,
  getShifts,
  getShiftById,
  updateShiftStatus,
  updateShift,
  patrolCheckin,
  getCheckins,
  submitPatrolReport,
  getReports,
  getPatrolStats,
} from '../controllers/patrol.controller';

const router = Router();

// ============================================
// SHIFT ENDPOINTS
// ============================================

/**
 * @route   POST /api/patrol/shifts
 * @desc    Create a new patrol shift
 * @access  Private
 */
router.post('/shifts', validate(shiftCreationSchema), createShift);

/**
 * @route   GET /api/patrol/shifts
 * @desc    Get shifts with pagination and filtering
 * @access  Private
 */
router.get('/shifts', validateQuery(shiftQuerySchema), getShifts);

/**
 * @route   GET /api/patrol/shifts/stats
 * @desc    Get patrol statistics
 * @access  Private
 */
router.get('/shifts/stats', getPatrolStats);

/**
 * @route   GET /api/patrol/shifts/:id
 * @desc    Get shift by ID
 * @access  Private
 */
router.get('/shifts/:id', getShiftById);

/**
 * @route   PUT /api/patrol/shifts/:id
 * @desc    Update shift information
 * @access  Private
 */
router.put('/shifts/:id', validate(shiftUpdateSchema), updateShift);

/**
 * @route   PATCH /api/patrol/shifts/:id/status
 * @desc    Update shift status
 * @access  Private
 */
router.patch('/shifts/:id/status', validate(shiftStatusSchema), updateShiftStatus);

// ============================================
// CHECK-IN ENDPOINTS
// ============================================

/**
 * @route   POST /api/patrol/checkins
 * @desc    Patrol check-in
 * @access  Private
 */
router.post('/checkins', validate(patrolCheckinSchema), patrolCheckin);

/**
 * @route   GET /api/patrol/checkins
 * @desc    Get patrol check-ins
 * @access  Private
 */
router.get('/checkins', getCheckins);

// ============================================
// REPORT ENDPOINTS
// ============================================

/**
 * @route   POST /api/patrol/reports
 * @desc    Submit patrol report
 * @access  Private
 */
router.post('/reports', validate(patrolReportSchema), submitPatrolReport);

/**
 * @route   GET /api/patrol/reports
 * @desc    Get patrol reports
 * @access  Private
 */
router.get('/reports', getReports);

export default router;
