import { Router } from 'express';
import { db } from '@rt-muban/shared';
import { validateRequest } from '../middleware/validation.middleware';
import { createDepositSchema, updateDepositSchema } from '../schemas/waste-bank.schema';
import logger from '@rt-muban/shared/src/utils/logger';

const router = Router();

/**
 * @route   POST /api/waste-bank/deposits
 * @desc    Record a waste deposit
 * @access  Private (Resident, Waste Collector, Admin)
 */
router.post('/', validateRequest(createDepositSchema), async (req, res) => {
  try {
    const { userId } = req.user!;
    const { wasteCategoryId, quantity, collectionDate, notes } = req.body;

    // Get waste category to calculate points
    const categoryResult = await db.query(
      'SELECT id, name, points_per_unit, unit_of_measurement FROM waste_categories WHERE id = $1 AND is_active = true',
      [wasteCategoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Waste category not found',
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'The specified waste category does not exist or is inactive',
        },
      });
    }

    const category = categoryResult.rows[0];
    const pointsEarned = quantity * category.points_per_unit;

    // Create deposit record
    const result = await db.query(
      `INSERT INTO waste_deposits (user_id, waste_category_id, quantity, points_earned, collection_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, user_id, waste_category_id, quantity, points_earned, collection_date, notes, status, created_at`,
      [userId, wasteCategoryId, quantity, pointsEarned, collectionDate, notes]
    );

    // Update user points
    await db.query(
      `UPDATE users SET recycling_points = COALESCE(recycling_points, 0) + $1 WHERE id = $2`,
      [pointsEarned, userId]
    );

    logger.info(`Waste deposit recorded: User ${userId}, Category ${wasteCategoryId}, Quantity ${quantity}`);

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        wasteCategoryId: result.rows[0].waste_category_id,
        quantity: result.rows[0].quantity,
        pointsEarned: result.rows[0].points_earned,
        collectionDate: result.rows[0].collection_date,
        notes: result.rows[0].notes,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
        category: {
          id: category.id,
          name: category.name,
          unitOfMeasurement: category.unit_of_measurement,
          pointsPerUnit: category.points_per_unit,
        },
      },
      message: 'Waste deposit recorded successfully',
    });
  } catch (error) {
    logger.error('Waste deposit creation error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to record waste deposit',
      error: {
        code: 'DEPOSIT_CREATION_ERROR',
        message: 'An error occurred while recording the waste deposit',
      },
    });
  }
});

/**
 * @route   GET /api/waste-bank/deposits/:userId
 * @desc    Get user's waste deposits
 * @access  Private (User, Admin, RT Leader)
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM waste_deposits WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);

    // Get deposits with pagination
    const result = await db.query(
      `SELECT wd.id, wd.user_id, wd.waste_category_id, wd.quantity, wd.points_earned, 
              wd.collection_date, wd.notes, wd.status, wd.created_at,
              wc.name as category_name, wc.unit_of_measurement, wc.points_per_unit
       FROM waste_deposits wd
       LEFT JOIN waste_categories wc ON wd.waste_category_id = wc.id
       WHERE wd.user_id = $1
       ORDER BY wd.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offset]
    );

    res.json({
      success: true,
      data: {
        deposits: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasMore: offset + limitNum < total,
        },
      },
      message: 'User waste deposits retrieved successfully',
    });
  } catch (error) {
    logger.error('Get user deposits error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve waste deposits',
      error: {
        code: 'DEPOSITS_RETRIEVAL_ERROR',
        message: 'An error occurred while retrieving waste deposits',
      },
    });
  }
});

/**
 * @route   GET /api/waste-bank/deposits/:id
 * @desc    Get specific deposit details
 * @access  Private (User, Admin, RT Leader)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT wd.id, wd.user_id, wd.waste_category_id, wd.quantity, wd.points_earned, 
              wd.collection_date, wd.notes, wd.status, wd.created_at,
              wc.name as category_name, wc.unit_of_measurement, wc.points_per_unit
       FROM waste_deposits wd
       LEFT JOIN waste_categories wc ON wd.waste_category_id = wc.id
       WHERE wd.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Deposit not found',
        error: {
          code: 'DEPOSIT_NOT_FOUND',
          message: 'The specified deposit does not exist',
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Deposit details retrieved successfully',
    });
  } catch (error) {
    logger.error('Get deposit error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve deposit details',
      error: {
        code: 'DEPOSIT_RETRIEVAL_ERROR',
        message: 'An error occurred while retrieving deposit details',
      },
    });
  }
});

/**
 * @route   PUT /api/waste-bank/deposits/:id
 * @desc    Update deposit status (Waste Collector, Admin)
 * @access  Private
 */
router.put('/:id', validateRequest(updateDepositSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, collectedBy, collectedAt, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'scheduled', 'collected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid status',
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        },
      });
    }

    // Update deposit
    const result = await db.query(
      `UPDATE waste_deposits 
       SET status = $1, collected_by = $2, collected_at = $3, collection_notes = $4
       WHERE id = $5
       RETURNING id, status, collected_by, collected_at, collection_notes`,
      [status, collectedBy, collectedAt, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Deposit not found',
        error: {
          code: 'DEPOSIT_NOT_FOUND',
          message: 'The specified deposit does not exist',
        },
      });
    }

    logger.info(`Deposit status updated: ${id}, Status: ${status}`);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Deposit status updated successfully',
    });
  } catch (error) {
    logger.error('Update deposit error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update deposit status',
      error: {
        code: 'DEPOSIT_UPDATE_ERROR',
        message: 'An error occurred while updating deposit status',
      },
    });
  }
});

/**
 * @route   GET /api/waste-bank/points/:userId
 * @desc    Get user's recycling points
 * @access  Private (User, Admin, RT Leader)
 */
router.get('/points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's total points
    const result = await db.query(
      `SELECT 
        COALESCE(SUM(points_earned), 0) as total_points,
        COUNT(*) as total_deposits,
        MAX(created_at) as last_deposit
       FROM waste_deposits 
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    const userResult = await db.query(
      'SELECT recycling_points FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        userId,
        totalPoints: parseInt(result.rows[0].total_points),
        totalDeposits: parseInt(result.rows[0].total_deposits),
        lastDeposit: result.rows[0].last_deposit,
        currentBalance: userResult.rows[0]?.recycling_points || 0,
      },
      message: 'User recycling points retrieved successfully',
    });
  } catch (error) {
    logger.error('Get user points error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve recycling points',
      error: {
        code: 'POINTS_RETRIEVAL_ERROR',
        message: 'An error occurred while retrieving recycling points',
      },
    });
  }
});

export default router;
