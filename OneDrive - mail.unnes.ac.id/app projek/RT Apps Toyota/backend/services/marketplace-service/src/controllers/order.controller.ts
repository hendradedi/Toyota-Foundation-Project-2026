import { Request, Response } from 'express';
import { getPool } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { OrderCreationInput, OrderStatusInput, OrderUpdateInput } from '../schemas/order.schema';

/**
 * Generate unique order number
 */
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Create a new order
 */
export const createOrder = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { user_id, business_id, items, delivery_method, delivery_address, phone, notes, payment_method } = req.body as OrderCreationInput;

    // Check if business exists and is active
    const businessCheck = await client.query(
      'SELECT id, name, is_active, delivery_available, pickup_available FROM businesses WHERE id = $1',
      [business_id]
    );

    if (businessCheck.rows.length === 0) {
      await client.query('ROLLBACK');
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

    const business = businessCheck.rows[0];

    if (!business.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Business is not active',
        error: {
          code: 'BUSINESS_INACTIVE',
          message: 'Cannot place order with inactive business',
        },
      });
    }

    // Validate delivery method
    if (delivery_method === 'delivery' && !business.delivery_available) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Delivery not available for this business',
        error: {
          code: 'DELIVERY_NOT_AVAILABLE',
          message: 'This business does not offer delivery',
        },
      });
    }

    if (delivery_method === 'pickup' && !business.pickup_available) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Pickup not available for this business',
        error: {
          code: 'PICKUP_NOT_AVAILABLE',
          message: 'This business does not offer pickup',
        },
      });
    }

    // Validate products and check stock
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const productCheck = await client.query(
        'SELECT id, name, price, stock_quantity, is_available FROM products WHERE id = $1 AND business_id = $2',
        [item.product_id, business_id]
      );

      if (productCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          data: null,
          message: `Product with ID ${item.product_id} not found`,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'One or more products do not exist',
          },
        });
      }

      const product = productCheck.rows[0];

      if (!product.is_available) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          data: null,
          message: `Product "${product.name}" is not available`,
          error: {
            code: 'PRODUCT_UNAVAILABLE',
            message: 'One or more products are not available',
          },
        });
      }

      if (product.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          data: null,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}`,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: 'One or more products have insufficient stock',
          },
        });
      }

      const unitPrice = item.unit_price || product.price;
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      });
    }

    const orderNumber = generateOrderNumber();

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, user_id, business_id, total_amount, delivery_method, delivery_address, phone, notes, payment_method, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [orderNumber, user_id, business_id, totalAmount, delivery_method, delivery_address || null, phone || null, notes || null, payment_method, 'pending']
    );

    const order = orderResult.rows[0];

    // Create order items and update stock
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [order.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
      );

      // Update product stock
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');

    logger.info('Order created', { order_id: order.id, orderNumber, user_id, business_id, total_amount: totalAmount });

    res.status(201).json({
      success: true,
      data: {
        ...order,
        items: validatedItems,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create order',
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
 * Get orders with pagination and filtering
 */
export const getOrders = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { page = 1, limit = 10, user_id, business_id, status, start_date, end_date, sort_by = 'date_desc' } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = `
      SELECT o.*, b.name as business_name, u.full_name as user_name
      FROM orders o
      JOIN businesses b ON o.business_id = b.id
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND o.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (business_id) {
      query += ` AND o.business_id = $${paramCount}`;
      params.push(business_id);
      paramCount++;
    }

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND DATE(o.created_at) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(o.created_at) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Get total count
    const countResult = await client.query(
      query.replace('SELECT o.*, b.name as business_name, u.full_name as user_name', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Add sorting
    switch (sort_by) {
      case 'date_asc':
        query += ' ORDER BY o.created_at ASC';
        break;
      case 'total_asc':
        query += ' ORDER BY o.total_amount ASC';
        break;
      case 'total_desc':
        query += ' ORDER BY o.total_amount DESC';
        break;
      case 'date_desc':
      default:
        query += ' ORDER BY o.created_at DESC';
        break;
    }

    // Get paginated results
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        orders: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Orders retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch orders',
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
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;

    const orderResult = await client.query(
      `SELECT o.*, b.name as business_name, b.phone as business_phone, b.address as business_address, u.full_name as user_name
       FROM orders o
       JOIN businesses b ON o.business_id = b.id
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Order does not exist',
        },
      });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows,
      },
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch order',
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
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, notes } = req.body as OrderStatusInput;

    // Check if order exists
    const orderCheck = await client.query(
      'SELECT id, status FROM orders WHERE id = $1',
      [id]
    );

    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Order does not exist',
        },
      });
    }

    const currentStatus = orderCheck.rows[0].status;

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['ready', 'cancelled'],
      ready: ['completed', 'cancelled'],
      completed: ['refunded'],
      cancelled: [],
      refunded: [],
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

    // Update order status
    const result = await client.query(
      `UPDATE orders SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, notes, id]
    );

    // If cancelled or refunded, restore stock
    if (status === 'cancelled' || status === 'refunded') {
      const items = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      );

      for (const item of items.rows) {
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query('COMMIT');

    logger.info('Order status updated', { order_id: id, status, previous_status: currentStatus });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Order status updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update order status',
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
 * Update order information
 */
export const updateOrder = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const updates = req.body as OrderUpdateInput;

    // Check if order exists and is pending
    const orderCheck = await client.query(
      'SELECT id, status FROM orders WHERE id = $1',
      [id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Order does not exist',
        },
      });
    }

    if (orderCheck.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Can only update pending orders',
        error: {
          code: 'INVALID_STATUS',
          message: 'Order must be pending to update',
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
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    logger.info('Order updated', { order_id: id });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Order updated successfully',
    });
  } catch (error) {
    logger.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update order',
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
 * Cancel order
 */
export const cancelOrder = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;

    // Check if order exists and can be cancelled
    const orderCheck = await client.query(
      'SELECT id, status FROM orders WHERE id = $1',
      [id]
    );

    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Order does not exist',
        },
      });
    }

    const cancellableStatuses = ['pending', 'confirmed', 'processing', 'ready'];
    if (!cancellableStatuses.includes(orderCheck.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        data: null,
        message: 'This order cannot be cancelled',
        error: {
          code: 'INVALID_STATUS',
          message: `Order with status ${orderCheck.rows[0].status} cannot be cancelled`,
        },
      });
    }

    // Update order status
    const result = await client.query(
      `UPDATE orders SET status = 'cancelled', notes = COALESCE($1, notes), updated_at = NOW() WHERE id = $2 RETURNING *`,
      [reason, id]
    );

    // Restore stock
    const items = await client.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [id]
    );

    for (const item of items.rows) {
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');

    logger.info('Order cancelled', { order_id: id, reason });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to cancel order',
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
 * Get order statistics
 */
export const getOrderStats = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { business_id, user_id } = req.query;

    let whereClause = '1=1';
    const params: any[] = [];

    if (business_id) {
      whereClause += ` AND business_id = $${params.length + 1}`;
      params.push(business_id);
    }

    if (user_id) {
      whereClause += ` AND user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    // Get total orders
    const totalResult = await client.query(
      `SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`,
      params
    );

    // Get orders by status
    const statusResult = await client.query(
      `SELECT status, COUNT(*) as count FROM orders WHERE ${whereClause} GROUP BY status`,
      params
    );

    // Get total revenue
    const revenueResult = await client.query(
      `SELECT SUM(total_amount) as total_revenue FROM orders WHERE ${whereClause} AND status = 'completed'`,
      params
    );

    // Get average order value
    const avgResult = await client.query(
      `SELECT AVG(total_amount) as avg_order_value FROM orders WHERE ${whereClause} AND status = 'completed'`,
      params
    );

    const statusCounts = statusResult.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        total_orders: parseInt(totalResult.rows[0].total, 10),
        total_revenue: parseFloat(revenueResult.rows[0].total_revenue || 0),
        average_order_value: parseFloat(avgResult.rows[0].avg_order_value || 0),
        by_status: statusCounts,
      },
      message: 'Order statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch order statistics',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};
