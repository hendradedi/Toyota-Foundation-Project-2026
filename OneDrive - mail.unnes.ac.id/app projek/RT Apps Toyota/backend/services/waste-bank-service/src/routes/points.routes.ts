import { Router } from 'express';
import { PointsController } from '../controllers/points.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { redeemPointsSchema, transferPointsSchema } from '../schemas/waste-bank.schema';

const router = Router();
const pointsController = new PointsController();

/**
 * @route   GET /api/waste-bank/points/:userId
 * @desc    Get user's points summary
 * @access  Private (User, Admin, RT Leader)
 */
router.get('/:userId', (req, res) => pointsController.getUserPoints(req, res));

/**
 * @route   GET /api/waste-bank/points/:userId/history
 * @desc    Get user's points transaction history
 * @access  Private (User, Admin, RT Leader)
 */
router.get('/:userId/history', (req, res) => pointsController.getPointsHistory(req, res));

/**
 * @route   POST /api/waste-bank/points/redeem
 * @desc    Redeem user's points
 * @access  Private (User, Admin)
 */
router.post('/redeem', validateRequest(redeemPointsSchema), (req, res) =>
  pointsController.redeemPoints(req, res)
);

/**
 * @route   POST /api/waste-bank/points/transfer
 * @desc    Transfer points between users
 * @access  Private (User, Admin)
 */
router.post('/transfer', validateRequest(transferPointsSchema), (req, res) =>
  pointsController.transferPoints(req, res)
);

/**
 * @route   GET /api/waste-bank/leaderboard
 * @desc    Get points leaderboard
 * @access  Public
 */
router.get('/leaderboard', (req, res) => pointsController.getLeaderboard(req, res));

/**
 * @route   GET /api/waste-bank/statistics
 * @desc    Get waste banking statistics
 * @access  Public
 */
router.get('/statistics', (req, res) => pointsController.getStatistics(req, res));

export default router;
