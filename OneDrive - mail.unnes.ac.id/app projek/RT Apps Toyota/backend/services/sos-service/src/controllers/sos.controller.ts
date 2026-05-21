import { Request, Response } from 'express';
import { getPool } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { SOSAlertInput, SOSAlertUpdateInput, SOSAlertResponseInput, SOSBroadcastInput } from '../schemas/sos.schema';

/**
 * Generate unique alert number
 */
const generateAlertNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SOS-${timestamp}-${random}`;
};

/**
 * Create a new SOS alert
 */
export const createAlert = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { user_id, alert_type, description, location, contact_phone, is_verified } = req.body as SOSAlertInput;

    const alertNumber = generateAlertNumber();

    // Create alert
    const result = await client.query(
      `INSERT INTO emergency_alerts (alert_number, user_id, alert_type, description, latitude, longitude, address, contact_phone, status, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [
        alertNumber,
        user_id,
        alert_type,
        description,
        location.latitude,
        location.longitude,
        location.address || null,
        contact_phone || null,
        'pending',
        is_verified || false
      ]
    );

    const alert = result.rows[0];

    // Get user's neighborhood for broadcasting
    const userResult = await client.query(
      `SELECT u.neighborhood_id 
       FROM users u 
       WHERE u.id = $1`,
      [user_id]
    );

    let neighborhoodId = null;
    if (userResult.rows.length > 0) {
      neighborhoodId = userResult.rows[0].neighborhood_id;
    }

    await client.query('COMMIT');

    logger.info('SOS Alert created', { alert_id: alert.id, alert_number: alertNumber, user_id, alert_type });

    // Trigger notification broadcast (would be handled by notification service in production)
    // For now, we'll just log it
    logger.info('SOS Alert broadcast triggered', {
      alert_id: alert.id,
      alert_type,
      neighborhood_id: neighborhoodId,
      location: { lat: location.latitude, lng: location.longitude }
    });

    res.status(201).json({
      success: true,
      data: alert,
      message: 'SOS Alert created successfully. Help is on the way.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating SOS alert:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create SOS alert',
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
 * Get alerts with pagination and filtering
 */
export const getAlerts = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { page = 1, limit = 10, status, alert_type, user_id, start_date, end_date, sort_by = 'date_desc' } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = `
      SELECT e.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_name, u.phone as user_phone
      FROM sos_alerts e
      JOIN users u ON e.reporter_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (alert_type) {
      query += ` AND e.alert_type = $${paramCount}`;
      params.push(alert_type);
      paramCount++;
    }

    if (user_id) {
      query += ` AND e.reporter_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND DATE(e.created_at) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(e.created_at) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Get total count
    const countResult = await client.query(
      query.replace("SELECT e.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_name, u.phone as user_phone", 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Add sorting
    if (sort_by === 'date_asc') {
      query += ' ORDER BY e.created_at ASC';
    } else {
      query += ' ORDER BY e.created_at DESC';
    }

    // Get paginated results
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Alerts retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch alerts',
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
 * Get alert by ID
 */
export const getAlertById = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      `SELECT e.*, u.full_name as user_name, u.phone as user_phone, u.neighborhood_id
       FROM emergency_alerts e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Alert not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Alert does not exist',
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Alert retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch alert',
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
 * Update alert status (respond to alert)
 */
export const respondToAlert = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, notes, responder_id } = req.body as SOSAlertResponseInput;

    // Check if alert exists
    const alertCheck = await client.query(
      'SELECT id, status FROM emergency_alerts WHERE id = $1',
      [id]
    );

    if (alertCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Alert not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Alert does not exist',
        },
      });
    }

    const currentStatus = alertCheck.rows[0].status;

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['responding', 'cancelled'],
      responding: ['resolved', 'cancelled'],
      resolved: [],
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

    // Update alert
    const result = await client.query(
      `UPDATE emergency_alerts SET status = $1, notes = COALESCE($2, notes), responder_id = COALESCE($3, responder_id), updated_at = NOW() WHERE id = $4 RETURNING *`,
      [status, notes, responder_id, id]
    );

    await client.query('COMMIT');

    logger.info('Alert status updated', { alert_id: id, status, previous_status: currentStatus });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Alert status updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating alert status:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update alert status',
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
 * Update alert information
 */
export const updateAlert = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const updates = req.body as SOSAlertUpdateInput;

    // Check if alert exists and is pending
    const alertCheck = await client.query(
      'SELECT id, status FROM emergency_alerts WHERE id = $1',
      [id]
    );

    if (alertCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Alert not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Alert does not exist',
        },
      });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(updates.status);
      paramCount++;
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(updates.description);
      paramCount++;
    }

    if (updates.location !== undefined) {
      updateFields.push(`latitude = $${paramCount}`);
      updateValues.push(updates.location.latitude);
      paramCount++;
      updateFields.push(`longitude = $${paramCount}`);
      updateValues.push(updates.location.longitude);
      paramCount++;
      if (updates.location.address) {
        updateFields.push(`address = $${paramCount}`);
        updateValues.push(updates.location.address);
        paramCount++;
      }
    }

    if (updates.contact_phone !== undefined) {
      updateFields.push(`contact_phone = $${paramCount}`);
      updateValues.push(updates.contact_phone);
      paramCount++;
    }

    if (updates.is_verified !== undefined) {
      updateFields.push(`is_verified = $${paramCount}`);
      updateValues.push(updates.is_verified);
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
      `UPDATE emergency_alerts SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    logger.info('Alert updated', { alert_id: id });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Alert updated successfully',
    });
  } catch (error) {
    logger.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update alert',
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
 * Cancel alert
 */
export const cancelAlert = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;

    // Check if alert exists and can be cancelled
    const alertCheck = await client.query(
      'SELECT id, status FROM emergency_alerts WHERE id = $1',
      [id]
    );

    if (alertCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Alert not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Alert does not exist',
        },
      });
    }

    const cancellableStatuses = ['pending', 'confirmed', 'responding'];
    if (!cancellableStatuses.includes(alertCheck.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'This alert cannot be cancelled',
        error: {
          code: 'INVALID_STATUS',
          message: `Alert with status ${alertCheck.rows[0].status} cannot be cancelled`,
        },
      });
    }

    // Update alert status
    const result = await client.query(
      `UPDATE emergency_alerts SET status = 'cancelled', notes = COALESCE($1, notes), updated_at = NOW() WHERE id = $2 RETURNING *`,
      [reason, id]
    );

    await client.query('COMMIT');

    logger.info('Alert cancelled', { alert_id: id, reason });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Alert cancelled successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error cancelling alert:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to cancel alert',
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get nearby alerts (within radius)
 */
export const getNearbyAlerts = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { latitude, longitude, radius = 1 } = req.query; // radius in km

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Latitude and longitude are required',
        error: {
          code: 'INVALID_INPUT',
          message: 'Location coordinates are required',
        },
      });
    }

    // Using Haversine formula to calculate distance
    const result = await client.query(
      `SELECT e.*, u.full_name as user_name,
        (6371 * acos(
          cos(radians($1)) * cos(radians(e.latitude)) * 
          cos(radians(e.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(e.latitude))
        )) AS distance
       FROM emergency_alerts e
       JOIN users u ON e.user_id = u.id
       WHERE e.status IN ('pending', 'confirmed', 'responding')
       HAVING (6371 * acos(
         cos(radians($1)) * cos(radians(e.latitude)) * 
         cos(radians(e.longitude) - radians($2)) + 
         sin(radians($1)) * sin(radians(e.latitude))
       )) <= $3
       ORDER BY distance ASC
       LIMIT 20`,
      [latitude, longitude, radius]
    );

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        center: { latitude: Number(latitude), longitude: Number(longitude) },
        radius: Number(radius),
      },
      message: 'Nearby alerts retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching nearby alerts:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch nearby alerts',
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
 * Get alert statistics
 */
export const getAlertStats = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { start_date, end_date } = req.query;

    let whereClause = '1=1';
    const params: any[] = [];

    if (start_date) {
      whereClause += ` AND DATE(created_at) >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND DATE(created_at) <= $${params.length + 1}`;
      params.push(end_date);
    }

    // Get total alerts
    const totalResult = await client.query(
      `SELECT COUNT(*) as total FROM emergency_alerts WHERE ${whereClause}`,
      params
    );

    // Get alerts by status
    const statusResult = await client.query(
      `SELECT status, COUNT(*) as count FROM emergency_alerts WHERE ${whereClause} GROUP BY status`,
      params
    );

    // Get alerts by type
    const typeResult = await client.query(
      `SELECT alert_type, COUNT(*) as count FROM emergency_alerts WHERE ${whereClause} GROUP BY alert_type`,
      params
    );

    // Get average response time (time between creation and confirmed status)
    const responseTimeResult = await client.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time
       FROM emergency_alerts
       WHERE ${whereClause} AND status IN ('confirmed', 'responding', 'resolved')`,
      params
    );

    const statusCounts = statusResult.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = typeResult.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.alert_type] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        total_alerts: parseInt(totalResult.rows[0].total, 10),
        by_status: statusCounts,
        by_type: typeCounts,
        average_response_time_seconds: parseFloat(responseTimeResult.rows[0].avg_response_time || 0),
      },
      message: 'Alert statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch alert statistics',
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
 * Broadcast alert to nearby residents
 */
export const broadcastAlert = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { alert_id, message, recipients, priority } = req.body as SOSBroadcastInput;

    // Check if alert exists
    const alertCheck = await client.query(
      'SELECT id, alert_type, status, latitude, longitude, user_id FROM emergency_alerts WHERE id = $1',
      [alert_id]
    );

    if (alertCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Alert not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Alert does not exist',
        },
      });
    }

    const alert = alertCheck.rows[0];

    // Determine recipients
    let targetRecipients: number[] = [];

    if (recipients && recipients.length > 0) {
      targetRecipients = recipients;
    } else {
      // Get nearby residents (within 1km radius)
      const nearbyUsers = await client.query(
        `SELECT u.id
         FROM users u
         JOIN households h ON u.household_id = h.id
         WHERE (6371 * acos(
           cos(radians($1)) * cos(radians(h.latitude)) * 
           cos(radians(h.longitude) - radians($2)) + 
           sin(radians($1)) * sin(radians(h.latitude))
         )) <= 1
         AND u.id != $3`,
        [alert.latitude, alert.longitude, alert.user_id]
      );

      targetRecipients = nearbyUsers.rows.map((row: any) => row.id);
    }

    // Create notifications for each recipient
    for (const userId of targetRecipients) {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, priority, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          userId,
          `SOS Alert: ${alert.alert_type.toUpperCase()}`,
          message,
          'sos_alert',
          alert_id,
          priority
        ]
      );
    }

    logger.info('Alert broadcasted', { alert_id, recipient_count: targetRecipients.length, priority });

    res.json({
      success: true,
      data: {
        alert_id,
        recipient_count: targetRecipients.length,
        priority,
      },
      message: 'Alert broadcasted successfully',
    });
  } catch (error) {
    logger.error('Error broadcasting alert:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to broadcast alert',
      error: {
        code: 'BROADCAST_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};
