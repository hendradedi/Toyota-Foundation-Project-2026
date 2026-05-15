import { Request, Response } from 'express';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';

export class PointsController {
  /**
   * Get user's points summary
   */
  async getUserPoints(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Get user's total points and statistics
      const statsResult = await db.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN status = 'completed' THEN points_earned ELSE 0 END), 0) as total_earned,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END), 0) as total_weight,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_deposits,
          COUNT(*) as total_deposits,
          MAX(created_at) as last_deposit
         FROM waste_deposits 
         WHERE user_id = $1`,
        [userId]
      );

      // Get user's current balance
      const userResult = await db.query(
        'SELECT recycling_points, first_name, last_name FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
          error: {
            code: 'USER_NOT_FOUND',
            message: 'The specified user does not exist',
          },
        });
      }

      // Get points redeemed
      const redeemedResult = await db.query(
        `SELECT COALESCE(SUM(points_used), 0) as total_redeemed
         FROM points_transactions
         WHERE user_id = $1 AND transaction_type = 'redemption'`,
        [userId]
      );

      // Get user's rank in neighborhood
      const rankResult = await db.query(
        `SELECT COUNT(*) + 1 as rank
         FROM users u1
         WHERE u1.recycling_points > (SELECT recycling_points FROM users WHERE id = $1)`,
        [userId]
      );

      const stats = statsResult.rows[0];
      const user = userResult.rows[0];
      const redeemed = redeemedResult.rows[0];

      res.json({
        success: true,
        data: {
          userId,
          userName: `${user.first_name} ${user.last_name || ''}`.trim(),
          currentBalance: parseInt(user.recycling_points) || 0,
          totalEarned: parseInt(stats.total_earned),
          totalRedeemed: parseInt(redeemed.total_redeemed),
          totalWeight: parseFloat(stats.total_weight),
          completedDeposits: parseInt(stats.completed_deposits),
          totalDeposits: parseInt(stats.total_deposits),
          lastDeposit: stats.last_deposit,
          rank: parseInt(rankResult.rows[0].rank),
        },
        message: 'User points summary retrieved successfully',
      });
    } catch (error) {
      logger.error('Get user points error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve user points',
        error: {
          code: 'POINTS_RETRIEVAL_ERROR',
          message: 'An error occurred while retrieving user points',
        },
      });
    }
  }

  /**
   * Get points transaction history
   */
  async getPointsHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '20', type } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = `
        SELECT id, user_id, transaction_type, points_amount, description, 
               reference_id, reference_type, created_at
        FROM points_transactions
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (type) {
        query += ` AND transaction_type = $${params.length + 1}`;
        params.push(type);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM points_transactions WHERE user_id = $1';
      const countParams: any[] = [userId];
      if (type) {
        countQuery += ' AND transaction_type = $2';
        countParams.push(type);
      }
      const countResult = await db.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          transactions: result.rows,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasMore: offset + limitNum < total,
          },
        },
        message: 'Points history retrieved successfully',
      });
    } catch (error) {
      logger.error('Get points history error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve points history',
        error: {
          code: 'HISTORY_RETRIEVAL_ERROR',
          message: 'An error occurred while retrieving points history',
        },
      });
    }
  }

  /**
   * Redeem points
   */
  async redeemPoints(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const { points, description, referenceType, referenceId } = req.body;

      // Check user's current balance
      const userResult = await db.query(
        'SELECT recycling_points FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
          error: {
            code: 'USER_NOT_FOUND',
            message: 'The specified user does not exist',
          },
        });
      }

      const currentBalance = parseInt(userResult.rows[0].recycling_points) || 0;

      if (currentBalance < points) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Insufficient points',
          error: {
            code: 'INSUFFICIENT_POINTS',
            message: `User has ${currentBalance} points, but ${points} points are required`,
          },
        });
      }

      // Start transaction
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Deduct points from user
        await client.query(
          'UPDATE users SET recycling_points = recycling_points - $1 WHERE id = $2',
          [points, userId]
        );

        // Record transaction
        const transactionResult = await client.query(
          `INSERT INTO points_transactions 
           (user_id, transaction_type, points_amount, description, reference_type, reference_id)
           VALUES ($1, 'redemption', $2, $3, $4, $5)
           RETURNING id, created_at`,
          [userId, -points, description, referenceType, referenceId]
        );

        await client.query('COMMIT');

        logger.info(`Points redeemed: User ${userId}, Points ${points}`);

        res.json({
          success: true,
          data: {
            transactionId: transactionResult.rows[0].id,
            userId,
            pointsRedeemed: points,
            newBalance: currentBalance - points,
            createdAt: transactionResult.rows[0].created_at,
          },
          message: 'Points redeemed successfully',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Redeem points error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to redeem points',
        error: {
          code: 'REDEMPTION_ERROR',
          message: 'An error occurred while redeeming points',
        },
      });
    }
  }

  /**
   * Transfer points between users
   */
  async transferPoints(req: Request, res: Response) {
    try {
      const { fromUserId, toUserId, points, description } = req.body;

      if (fromUserId === toUserId) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Cannot transfer points to yourself',
          error: {
            code: 'INVALID_TRANSFER',
            message: 'Source and destination users must be different',
          },
        });
      }

      // Check sender's balance
      const senderResult = await db.query(
        'SELECT recycling_points, first_name FROM users WHERE id = $1',
        [fromUserId]
      );

      if (senderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Sender not found',
          error: {
            code: 'SENDER_NOT_FOUND',
            message: 'The sender user does not exist',
          },
        });
      }

      const senderBalance = parseInt(senderResult.rows[0].recycling_points) || 0;

      if (senderBalance < points) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Insufficient points',
          error: {
            code: 'INSUFFICIENT_POINTS',
            message: `Sender has ${senderBalance} points, but ${points} points are required`,
          },
        });
      }

      // Check receiver exists
      const receiverResult = await db.query(
        'SELECT id, first_name FROM users WHERE id = $1',
        [toUserId]
      );

      if (receiverResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Receiver not found',
          error: {
            code: 'RECEIVER_NOT_FOUND',
            message: 'The receiver user does not exist',
          },
        });
      }

      // Start transaction
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Deduct from sender
        await client.query(
          'UPDATE users SET recycling_points = recycling_points - $1 WHERE id = $2',
          [points, fromUserId]
        );

        // Add to receiver
        await client.query(
          'UPDATE users SET recycling_points = COALESCE(recycling_points, 0) + $1 WHERE id = $2',
          [points, toUserId]
        );

        // Record sender transaction
        await client.query(
          `INSERT INTO points_transactions 
           (user_id, transaction_type, points_amount, description, reference_type, reference_id)
           VALUES ($1, 'transfer_out', $2, $3, 'user', $4)`,
          [fromUserId, -points, description || 'Points transfer', toUserId]
        );

        // Record receiver transaction
        await client.query(
          `INSERT INTO points_transactions 
           (user_id, transaction_type, points_amount, description, reference_type, reference_id)
           VALUES ($1, 'transfer_in', $2, $3, 'user', $4)`,
          [toUserId, points, description || 'Points received', fromUserId]
        );

        await client.query('COMMIT');

        logger.info(`Points transferred: From ${fromUserId} to ${toUserId}, Points ${points}`);

        res.json({
          success: true,
          data: {
            fromUserId,
            toUserId,
            pointsTransferred: points,
            senderNewBalance: senderBalance - points,
          },
          message: 'Points transferred successfully',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Transfer points error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to transfer points',
        error: {
          code: 'TRANSFER_ERROR',
          message: 'An error occurred while transferring points',
        },
      });
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(req: Request, res: Response) {
    try {
      const { neighborhoodId, period = 'all', limit = '10' } = req.query;

      let query = `
        SELECT u.id, u.first_name, u.last_name, u.profile_picture_url,
               COALESCE(u.recycling_points, 0) as points,
               COUNT(wd.id) as total_deposits,
               COALESCE(SUM(wd.quantity), 0) as total_weight
        FROM users u
        LEFT JOIN waste_deposits wd ON u.id = wd.user_id AND wd.status = 'completed'
      `;

      const params: any[] = [];

      if (neighborhoodId) {
        query += ` JOIN household_members hm ON u.id = hm.user_id
                   JOIN households h ON hm.household_id = h.id
                   WHERE h.neighborhood_id = $1`;
        params.push(neighborhoodId);
      }

      // Add period filter
      if (period !== 'all') {
        const whereClause = neighborhoodId ? 'AND' : 'WHERE';
        if (period === 'month') {
          query += ` ${whereClause} wd.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
        } else if (period === 'week') {
          query += ` ${whereClause} wd.created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
        }
      }

      query += ` GROUP BY u.id, u.first_name, u.last_name, u.profile_picture_url, u.recycling_points
                 ORDER BY points DESC
                 LIMIT $${params.length + 1}`;
      params.push(parseInt(limit as string));

      const result = await db.query(query, params);

      // Add rank to each user
      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        name: `${row.first_name} ${row.last_name || ''}`.trim(),
        profilePicture: row.profile_picture_url,
        points: parseInt(row.points),
        totalDeposits: parseInt(row.total_deposits),
        totalWeight: parseFloat(row.total_weight),
      }));

      res.json({
        success: true,
        data: {
          leaderboard,
          period,
          neighborhoodId: neighborhoodId || null,
        },
        message: 'Leaderboard retrieved successfully',
      });
    } catch (error) {
      logger.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve leaderboard',
        error: {
          code: 'LEADERBOARD_ERROR',
          message: 'An error occurred while retrieving leaderboard',
        },
      });
    }
  }

  /**
   * Get points statistics
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const { neighborhoodId, period = 'month' } = req.query;

      let dateFilter = '';
      if (period === 'week') {
        dateFilter = "AND wd.created_at >= DATE_TRUNC('week', CURRENT_DATE)";
      } else if (period === 'month') {
        dateFilter = "AND wd.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
      } else if (period === 'year') {
        dateFilter = "AND wd.created_at >= DATE_TRUNC('year', CURRENT_DATE)";
      }

      let neighborhoodFilter = '';
      const params: any[] = [];
      if (neighborhoodId) {
        neighborhoodFilter = `
          JOIN household_members hm ON wd.user_id = hm.user_id
          JOIN households h ON hm.household_id = h.id
          WHERE h.neighborhood_id = $1
        `;
        params.push(neighborhoodId);
      }

      const query = `
        SELECT 
          COUNT(DISTINCT wd.user_id) as active_users,
          COUNT(wd.id) as total_deposits,
          COALESCE(SUM(wd.points_earned), 0) as total_points_earned,
          COALESCE(SUM(wd.quantity), 0) as total_weight,
          COUNT(DISTINCT wd.waste_category_id) as categories_used
        FROM waste_deposits wd
        ${neighborhoodFilter}
        ${neighborhoodFilter ? 'AND' : 'WHERE'} wd.status = 'completed' ${dateFilter}
      `;

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: {
          period,
          neighborhoodId: neighborhoodId || null,
          activeUsers: parseInt(result.rows[0].active_users),
          totalDeposits: parseInt(result.rows[0].total_deposits),
          totalPointsEarned: parseInt(result.rows[0].total_points_earned),
          totalWeight: parseFloat(result.rows[0].total_weight),
          categoriesUsed: parseInt(result.rows[0].categories_used),
        },
        message: 'Statistics retrieved successfully',
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve statistics',
        error: {
          code: 'STATISTICS_ERROR',
          message: 'An error occurred while retrieving statistics',
        },
      });
    }
  }
}
