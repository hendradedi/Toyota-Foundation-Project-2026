import { Request, Response } from 'express';
import { getPool } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { ProductCreationInput, ProductUpdateInput, ProductStockInput } from '../schemas/marketplace.schema';

/**
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { business_id, name, description, category, price, unit, stock_quantity, min_order, max_order, image_url, is_available } = req.body as ProductCreationInput;

    // Check if business exists and is active
    const businessCheck = await client.query(
      'SELECT id, is_active FROM businesses WHERE id = $1',
      [business_id]
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

    if (!businessCheck.rows[0].is_active) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Cannot add products to inactive business',
        error: {
          code: 'BUSINESS_INACTIVE',
          message: 'Business must be active to add products',
        },
      });
    }

    // Create product
    const result = await client.query(
      `INSERT INTO products (business_id, name, description, category, price, unit, stock_quantity, min_order, max_order, image_url, is_available, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [business_id, name, description, category, price, unit, stock_quantity, min_order, max_order || null, image_url || null, is_available]
    );

    const product = result.rows[0];

    logger.info('Product created', { product_id: product.id, business_id });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create product',
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
 * Get all products with pagination and filtering
 */
export const getProducts = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { page = 1, limit = 10, business_id, category, is_available, search, min_price, max_price, sort_by = 'newest' } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = `
      SELECT p.*, b.business_name as business_name, b.category as business_category
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (business_id) {
      query += ` AND p.business_id = $${paramCount}`;
      params.push(business_id);
      paramCount++;
    }

    if (category) {
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (is_available !== undefined) {
      query += ` AND p.is_available = $${paramCount}`;
      params.push(is_available);
      paramCount++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (min_price) {
      query += ` AND p.price >= $${paramCount}`;
      params.push(min_price);
      paramCount++;
    }

    if (max_price) {
      query += ` AND p.price <= $${paramCount}`;
      params.push(max_price);
      paramCount++;
    }

    // Get total count
    const countResult = await client.query(
      query.replace('SELECT p.*, b.business_name as business_name, b.category as business_category', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Add sorting
    switch (sort_by) {
      case 'price_asc':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY p.price DESC';
        break;
      case 'name_asc':
        query += ' ORDER BY p.name ASC';
        break;
      case 'name_desc':
        query += ' ORDER BY p.name DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY p.created_at DESC';
        break;
    }

    // Get paginated results
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        products: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch products',
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
 * Get product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      `SELECT p.*, b.name as business_name, b.phone as business_phone, b.address as business_address, b.delivery_available, b.pickup_available
       FROM products p
       JOIN businesses b ON p.business_id = b.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Product does not exist',
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Product retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch product',
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
 * Update product information
 */
export const updateProduct = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const updates = req.body as ProductUpdateInput;

    // Check if product exists
    const existingProduct = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Product does not exist',
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
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    logger.info('Product updated', { product_id: id });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Product updated successfully',
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update product',
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
 * Update product stock
 */
export const updateProductStock = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;
    const { stock_quantity, reason } = req.body as ProductStockInput;

    const result = await client.query(
      `UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [stock_quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Product does not exist',
        },
      });
    }

    logger.info('Product stock updated', { product_id: id, stock_quantity, reason });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Product stock updated successfully',
    });
  } catch (error) {
    logger.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update product stock',
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
 * Delete product
 */
export const deleteProduct = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { id } = req.params;

    // Check if product has any orders
    const orderCheck = await client.query(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = $1',
      [id]
    );

    if (parseInt(orderCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Cannot delete product with existing orders',
        error: {
          code: 'HAS_ORDERS',
          message: 'Product has associated orders and cannot be deleted',
        },
      });
    }

    const result = await client.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Product does not exist',
        },
      });
    }

    logger.info('Product deleted', { product_id: id });

    res.json({
      success: true,
      data: { id: result.rows[0].id },
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete product',
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};

/**
 * Get products by business
 */
export const getProductsByBusiness = async (req: Request, res: Response) => {
  const client = await getPool().connect();
  
  try {
    const { businessId } = req.params;
    const { page = 1, limit = 10, is_available } = req.query;
    const offset = ((Number(page) - 1) * Number(limit));

    let query = 'SELECT * FROM products WHERE business_id = $1';
    const params: any[] = [businessId];
    let paramCount = 2;

    if (is_available !== undefined) {
      query += ` AND is_available = $${paramCount}`;
      params.push(is_available);
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
        products: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching business products:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch business products',
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    client.release();
  }
};
