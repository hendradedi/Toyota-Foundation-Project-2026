import { Router } from 'express';
import { validate, validateQuery } from '../middleware/validation.middleware';
import {
  sosAlertSchema,
  sosAlertUpdateSchema,
  sosAlertQuerySchema,
  sosAlertResponseSchema,
  sosBroadcastSchema,
} from '../schemas/sos.schema';
import {
  createAlert,
  getAlerts,
  getAlertById,
  respondToAlert,
  updateAlert,
  cancelAlert,
  getNearbyAlerts,
  getAlertStats,
  broadcastAlert,
} from '../controllers/sos.controller';

const router = Router();

/**
 * @route   POST /api/sos/alerts
 * @desc    Create a new SOS alert
 * @access  Private
 */
router.post('/alerts', validate(sosAlertSchema), createAlert);

/**
 * @route   GET /api/sos/alerts
 * @desc    Get alerts with pagination and filtering
 * @access  Private
 */
router.get('/alerts', validateQuery(sosAlertQuerySchema), getAlerts);

/**
 * @route   GET /api/sos/alerts/nearby
 * @desc    Get nearby alerts within radius
 * @access  Private
 */
router.get('/alerts/nearby', getNearbyAlerts);

/**
 * @route   GET /api/sos/alerts/stats
 * @desc    Get alert statistics
 * @access  Private
 */
router.get('/alerts/stats', getAlertStats);

/**
 * @route   GET /api/sos/alerts/:id
 * @desc    Get alert by ID
 * @access  Private
 */
router.get('/alerts/:id', getAlertById);

/**
 * @route   PUT /api/sos/alerts/:id
 * @desc    Update alert information
 * @access  Private
 */
router.put('/alerts/:id', validate(sosAlertUpdateSchema), updateAlert);

/**
 * @route   PATCH /api/sos/alerts/:id/respond
 * @desc    Respond to alert (update status)
 * @access  Private
 */
router.patch('/alerts/:id/respond', validate(sosAlertResponseSchema), respondToAlert);

/**
 * @route   POST /api/sos/alerts/:id/cancel
 * @desc    Cancel alert
 * @access  Private
 */
router.post('/alerts/:id/cancel', cancelAlert);

/**
 * @route   POST /api/sos/broadcast
 * @desc    Broadcast alert to nearby residents
 * @access  Private
 */
router.post('/broadcast', validate(sosBroadcastSchema), broadcastAlert);

export default router;
