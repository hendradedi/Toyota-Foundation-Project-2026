import { Request, Response } from 'express';
import { getPool } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { ShiftCreationInput, ShiftUpdateInput, ShiftStatusInput, PatrolCheckinInput, PatrolReportInput } from '../schemas/patrol.schema';

/**
 * Create a new patrol shift
 */
export const createShift = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { user_id, neighborhood_id, shift_type, start_time, end_time, notes } = req.body as ShiftCreationInput;

    // Check if user is assigned to this neighborhood
    const userCheck = await client.query(
      `SELECT u.id, u.full_name, u.role, h.neighborhood_id 
       FROM users u 
       JOIN households h ON u.household_id = h.id 
       WHERE u.id = $1`,
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found',
        error: {
          code: 'NOT_FOUND',
          message: 'User does not exist',
        },
      });
    }

    const user = userCheck.rows[0];

    // Check for overlapping shifts
    const overlappingCheck = await client.query(
      `SELECT id FROM patrol_shifts 
       WHERE user_id = $1 
       AND status IN ('scheduled', 'in_progress', 'completed')
       AND NOT ($2 >= end_time OR $1 <= start_time)`,
      [user_id, end_time, start_time]
    );

    if (overlappingCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'User already has a patrol shift during this time',
        error: {
          code: 'SHIFT_CONFLICT',
          message: 'Overlapping shift detected',
        },
      });
    }

    // Create shift
    const result = await client.query(
      `INSERT INTO patrol_shifts (user_id, neighborhood_id, shift_type, start_time, end_time, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [user_id, neighborhood_id, shift_type, start_time, end_time, 'scheduled', notes || null]
    );

    const shift = result.rows[0];

    await client.query('COMMIT');

    logger.info('Patrol shift created', { shift_id: shift.id, user_id, shift_type, start_time, end_time });

    res.status(201).json({
      success: true,
      data: shift,
      message: 'Patrol shift scheduled successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating patrol shift:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create patrol shift',
      error: {
        code: 'CREATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get shifts with pagination and filtering
 */
export const getShifts = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { page = 1, limit = 10, user_id, neighborhood_id, shift_type, status, start_date, end_date, sort_by = 'date_asc' } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = `
      SELECT ps.*, u.full_name as user_name, u.phone as user_phone, n.name as neighborhood_name
      FROM patrol_shifts ps
      JOIN users u ON ps.user_id = u.id
      JOIN neighborhoods n ON ps.neighborhood_id = n.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND ps.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (neighborhood_id) {
      query += ` AND ps.neighborhood_id = $${paramCount}`;
      params.push(neighborhood_id);
      paramCount++;
    }

    if (shift_type) {
      query += ` AND ps.shift_type = $${paramCount}`;
      params.push(shift_type);
      paramCount++;
    }

    if (status) {
      query += ` AND ps.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND DATE(ps.start_time) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(ps.end_time) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Get total count
    const countResult = await client.query(
      query.replace('SELECT ps.*, u.full_name as user_name, u.phone as user_phone, n.name as neighborhood_name', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Add sorting
    switch (sort_by) {
      case 'date_asc':
        query += ' ORDER BY ps.start_time ASC';
        break;
      case 'date_desc':
        query += ' ORDER BY ps.start_time DESC';
        break;
      case 'user_asc':
        query += ' ORDER BY u.full_name ASC';
        break;
      case 'user_desc':
        query += ' ORDER BY u.full_name DESC';
        break;
    }

    // Get paginated results
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        shifts: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Shifts retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching shifts:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch shifts',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get shift by ID
 */
export const getShiftById = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      `SELECT ps.*, u.full_name as user_name, u.phone as user_phone, n.name as neighborhood_name
       FROM patrol_shifts ps
       JOIN users u ON ps.user_id = u.id
       JOIN neighborhoods n ON ps.neighborhood_id = n.id
       WHERE ps.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Shift not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Shift does not exist',
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Shift retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching shift:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch shift',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Update shift status
 */
export const updateShiftStatus = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, notes } = req.body as ShiftStatusInput;

    // Check if shift exists
    const shiftCheck = await client.query(
      'SELECT id, status, user_id FROM patrol_shifts WHERE id = $1',
      [id]
    );

    if (shiftCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Shift not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Shift does not exist',
        },
      });
    }

    const currentStatus = shiftCheck.rows[0].status;

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      scheduled: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: `Cannot transition from ${currentStatus} to ${status}`,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Invalid status transition',
        },
      });
    }

    // Update shift
    const result = await client.query(
      `UPDATE patrol_shifts SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, notes, id]
    );

    await client.query('COMMIT');

    logger.info('Shift status updated', { shift_id: id, status, previous_status: currentStatus });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Shift status updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating shift status:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update shift status',
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Update shift information
 */
export const updateShift = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const updates = req.body as ShiftUpdateInput;

    // Check if shift exists and is scheduled
    const shiftCheck = await client.query(
      'SELECT id, status FROM patrol_shifts WHERE id = $1',
      [id]
    );

    if (shiftCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Shift not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Shift does not exist',
        },
      });
    }

    if (shiftCheck.rows[0].status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Can only update scheduled shifts',
        error: {
          code: 'INVALID_STATUS',
          message: 'Shift must be scheduled to update',
        },
      });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    if (updates.user_id !== undefined) {
      updateFields.push(`user_id = $${paramCount}`);
      updateValues.push(updates.user_id);
      paramCount++;
    }

    if (updates.neighborhood_id !== undefined) {
      updateFields.push(`neighborhood_id = $${paramCount}`);
      updateValues.push(updates.neighborhood_id);
      paramCount++;
    }

    if (updates.shift_type !== undefined) {
      updateFields.push(`shift_type = $${paramCount}`);
      updateValues.push(updates.shift_type);
      paramCount++;
    }

    if (updates.start_time !== undefined) {
      updateFields.push(`start_time = $${paramCount}`);
      updateValues.push(updates.start_time);
      paramCount++;
    }

    if (updates.end_time !== undefined) {
      updateFields.push(`end_time = $${paramCount}`);
      updateValues.push(updates.end_time);
      paramCount++;
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(updates.status);
      paramCount++;
    }

    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      updateValues.push(updates.notes);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'No fields to update',
        error: {
          code: 'INVALID_INPUT',
          message: 'At least one field must be provided',
        },
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await client.query(
      `UPDATE patrol_shifts SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    logger.info('Shift updated', { shift_id: id });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Shift updated successfully',
    });
  } catch (error) {
    logger.error('Error updating shift:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update shift',
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Patrol check-in
 */
export const patrolCheckin = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { shift_id, location, notes, photos } = req.body as PatrolCheckinInput;

    // Check if shift exists and is in progress
    const shiftCheck = await client.query(
      'SELECT id, status, user_id FROM patrol_shifts WHERE id = $1',
      [shift_id]
    );

    if (shiftCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Shift not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Shift does not exist',
        },
      });
    }

    if (shiftCheck.rows[0].status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Can only check in during active shifts',
        error: {
          code: 'INVALID_STATUS',
          message: 'Shift must be in progress to check in',
        },
      });
    }

    // Create check-in
    const result = await client.query(
      `INSERT INTO patrol_checkins (shift_id, latitude, longitude, address, notes, photos, checked_in_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [shift_id, location.latitude, location.longitude, location.address || null, notes || null, photos || []]
    );

    const checkin = result.rows[0];

    await client.query('COMMIT');

    logger.info('Patrol check-in recorded', { checkin_id: checkin.id, shift_id, location });

    res.status(201).json({
      success: true,
      data: checkin,
      message: 'Patrol check-in recorded successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error recording patrol check-in:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to record patrol check-in',
      error: {
        code: 'CHECKIN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get patrol check-ins
 */
export const getCheckins = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { shift_id, page = 1, limit = 10 } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = `
      SELECT pc.*, u.full_name as user_name
      FROM patrol_checkins pc
      JOIN patrol_shifts ps ON pc.shift_id = ps.id
      JOIN users u ON ps.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (shift_id) {
      query += ` AND pc.shift_id = $${paramCount}`;
      params.push(shift_id);
      paramCount++;
    }

    // Get total count
    const countResult = await client.query(
      query.replace('SELECT pc.*, u.full_name as user_name', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    query += ` ORDER BY pc.checked_in_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        checkins: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Check-ins retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching check-ins:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch check-ins',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Submit patrol report
 */
export const submitPatrolReport = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { shift_id, incidents, observations, recommendations, completed_at } = req.body as PatrolReportInput;

    // Check if shift exists and is in progress
    const shiftCheck = await client.query(
      'SELECT id, status, user_id, end_time FROM patrol_shifts WHERE id = $1',
      [shift_id]
    );

    if (shiftCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Shift not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Shift does not exist',
        },
      });
    }

    if (shiftCheck.rows[0].status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Can only submit report for active shifts',
        error: {
          code: 'INVALID_STATUS',
          message: 'Shift must be in progress to submit report',
        },
      });
    }

    // Create report
    const result = await client.query(
      `INSERT INTO patrol_reports (shift_id, incidents, observations, recommendations, completed_at, submitted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [shift_id, incidents || [], observations || null, recommendations || null, completed_at || null]
    );

    const report = result.rows[0];

    // Update shift status to completed
    await client.query(
      `UPDATE patrol_shifts SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [shift_id]
    );

    await client.query('COMMIT');

    logger.info('Patrol report submitted', { report_id: report.id, shift_id });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Patrol report submitted successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error submitting patrol report:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to submit patrol report',
      error: {
        code: 'REPORT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get patrol reports
 */
export const getReports = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { shift_id, page = 1, limit = 10 } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = `
      SELECT pr.*, u.full_name as user_name, ps.shift_type, ps.start_time, ps.end_time
      FROM patrol_reports pr
      JOIN patrol_shifts ps ON pr.shift_id = ps.id
      JOIN users u ON ps.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (shift_id) {
      query += ` AND pr.shift_id = $${paramCount}`;
      params.push(shift_id);
      paramCount++;
    }

    // Get total count
    const countResult = await client.query(
      query.replace('SELECT pr.*, u.full_name as user_name, ps.shift_type, ps.start_time, ps.end_time', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    query += ` ORDER BY pr.submitted_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        reports: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Reports retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch reports',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get patrol statistics
 */
export const getPatrolStats = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { user_id, neighborhood_id, start_date, end_date } = req.query;

    let whereClause = '1=1';
    const params: any[] = [];

    if (user_id) {
      whereClause += ` AND ps.user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    if (neighborhood_id) {
      whereClause += ` AND ps.neighborhood_id = $${params.length + 1}`;
      params.push(neighborhood_id);
    }

    if (start_date) {
      whereClause += ` AND DATE(ps.start_time) >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND DATE(ps.end_time) <= $${params.length + 1}`;
      params.push(end_date);
    }

    // Get total shifts
    const totalShifts = await client.query(
      `SELECT COUNT(*) as total FROM patrol_shifts WHERE ${whereClause}`,
      params
    );

    // Get shifts by status
    const statusResult = await client.query(
      `SELECT status, COUNT(*) as count FROM patrol_shifts WHERE ${whereClause} GROUP BY status`,
      params
    );

    // Get shifts by type
    const typeResult = await client.query(
      `SELECT shift_type, COUNT(*) as count FROM patrol_shifts WHERE ${whereClause} GROUP BY shift_type`,
      params
    );

    // Get total check-ins
    const checkinsResult = await client.query(
      `SELECT COUNT(*) as total 
       FROM patrol_checkins pc
       JOIN patrol_shifts ps ON pc.shift_id = ps.id
       WHERE ${whereClause}`,
      params
    );

    // Get total reports
    const reportsResult = await client.query(
      `SELECT COUNT(*) as total 
       FROM patrol_reports pr
       JOIN patrol_shifts ps ON pr.shift_id = ps.id
       WHERE ${whereClause}`,
      params
    );

    const statusCounts = statusResult.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = typeResult.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.shift_type] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        total_shifts: parseInt(totalShifts.rows[0].total, 10),
        by_status: statusCounts,
        by_type: typeCounts,
        total_checkins: parseInt(checkinsResult.rows[0].total, 10),
        total_reports: parseInt(reportsResult.rows[0].total, 10),
      },
      message: 'Patrol statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching patrol stats:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch patrol statistics',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};
