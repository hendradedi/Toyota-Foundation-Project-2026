import { Request, Response } from 'express';
import { getPool } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { BusinessRegistrationInput, BusinessUpdateInput, BusinessStatusInput } from '../schemas/marketplace.schema';

/**
 * Register a new business
 */
export const registerBusiness = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { name, description, category, owner_id, phone, address, operating_hours, delivery_available, pickup_available } = req.body as BusinessRegistrationInput;

    // Check if user already has a business
    const existingBusiness = await client.query(
      'SELECT id FROM businesses WHERE owner_id = $1',
      [owner_id]
    );

    if (existingBusiness.rows.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'User already has a registered business',
        error: {
          code: 'BUSINESS_EXISTS',
          message: 'Each user can only have one business',
        },
      });
    }

    // Create business
    const result = await client.query(
      `INSERT INTO businesses (name, description, category, owner_id, phone, address, operating_hours, delivery_available, pickup_available, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id, name, description, category, owner_id, phone, address, operating_hours, delivery_available, pickup_available, is_active, created_at, updated_at`,
      [name, description, category, owner_id, phone, address, operating_hours || null, delivery_available, pickup_available, true]
    );

    const business = result.rows[0];

    logger.info('Business registered', { business_id: business.id, owner_id });

    res.status(201).json({
      success: true,
      data: business,
      message: 'Business registered successfully',
    });
  } catch (error) {
    logger.error('Error registering business:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to register business',
      error: {
        code: 'REGISTRATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get all businesses with pagination and filtering
 */
export const getBusinesses = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { page = 1, limit = 10, category, is_active, search, delivery_available } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = 'SELECT * FROM businesses WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active);
      paramCount++;
    }

    if (delivery_available !== undefined) {
      query += ` AND delivery_available = $${paramCount}`;
      params.push(delivery_available);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await client.query(
      query.replace('SELECT *', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        businesses: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Businesses retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch businesses',
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
 * Get business by ID
 */
export const getBusinessById = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT * FROM businesses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Business not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Business does not exist',
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Business retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching business:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch business',
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
 * Update business information
 */
export const updateBusiness = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const updates = req.body as BusinessUpdateInput;

    // Check if business exists
    const existingBusiness = await client.query(
      'SELECT id FROM businesses WHERE id = $1',
      [id]
    );

    if (existingBusiness.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Business not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Business does not exist',
        },
      });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    });

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
      `UPDATE businesses SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    logger.info('Business updated', { business_id: id });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Business updated successfully',
    });
  } catch (error) {
    logger.error('Error updating business:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update business',
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
 * Update business status (activate/deactivate)
 */
export const updateBusinessStatus = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const { is_active, reason } = req.body as BusinessStatusInput;

    const result = await client.query(
      `UPDATE businesses SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Business not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Business does not exist',
        },
      });
    }

    logger.info('Business status updated', { business_id: id, is_active, reason });

    res.json({
      success: true,
      data: result.rows[0],
      message: `Business ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    logger.error('Error updating business status:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update business status',
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
 * Get business statistics
 */
export const getBusinessStats = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;

    // Check if business exists
    const businessCheck = await client.query(
      'SELECT id FROM businesses WHERE id = $1',
      [id]
    );

    if (businessCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Business not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Business does not exist',
        },
      });
    }

    // Get product count
    const productCount = await client.query(
      'SELECT COUNT(*) as count FROM products WHERE business_id = $1',
      [id]
    );

    // Get total stock value
    const stockValue = await client.query(
      'SELECT SUM(price * stock_quantity) as total_value FROM products WHERE business_id = $1',
      [id]
    );

    // Get average product price
    const avgPrice = await client.query(
      'SELECT AVG(price) as avg_price FROM products WHERE business_id = $1',
      [id]
    );

    // Get total orders (from order items)
    const orderStats = await client.query(
      `SELECT COUNT(DISTINCT oi.order_id) as total_orders, SUM(oi.quantity) as total_items_sold
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE p.business_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        product_count: parseInt(productCount.rows[0].count, 10),
        total_stock_value: parseFloat(stockValue.rows[0].total_value || 0),
        average_product_price: parseFloat(avgPrice.rows[0].avg_price || 0),
        total_orders: parseInt(orderStats.rows[0].total_orders || 0, 10),
        total_items_sold: parseInt(orderStats.rows[0].total_items_sold || 0, 10),
      },
      message: 'Business statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching business stats:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch business statistics',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};
