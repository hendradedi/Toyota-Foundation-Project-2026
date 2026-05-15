import { Request, Response } from 'express';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';

export class WasteCategoryController {
  /**
   * Get all waste categories
   */
  async getAll(req: Request, res: Response) {
    try {
      const result = await db.query(
        `SELECT id, name, description, unit_of_measurement, points_per_unit, is_active, created_at
         FROM waste_categories
         WHERE is_active = true
         ORDER BY name ASC`
      );

      res.json({
        success: true,
        data: result.rows,
        message: 'Waste categories retrieved successfully',
      });
    } catch (error) {
      logger.error('Get waste categories error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve waste categories',
        error: {
          code: 'CATEGORIES_RETRIEVAL_ERROR',
          message: 'An error occurred while retrieving waste categories',
        },
      });
    }
  }

  /**
   * Get waste category by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT id, name, description, unit_of_measurement, points_per_unit, is_active, created_at
         FROM waste_categories
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Waste category not found',
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'The specified waste category does not exist',
          },
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Waste category retrieved successfully',
      });
    } catch (error) {
      logger.error('Get waste category error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve waste category',
        error: {
          code: 'CATEGORY_RETRIEVAL_ERROR',
          message: 'An error occurred while retrieving waste category',
        },
      });
    }
  }

  /**
   * Create a new waste category (Admin only)
   */
  async create(req: Request, res: Response) {
    try {
      const { name, description, unitOfMeasurement, pointsPerUnit } = req.body;

      const result = await db.query(
        `INSERT INTO waste_categories (name, description, unit_of_measurement, points_per_unit)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, unit_of_measurement, points_per_unit, is_active, created_at`,
        [name, description, unitOfMeasurement, pointsPerUnit]
      );

      logger.info(`Waste category created: ${name}`);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Waste category created successfully',
      });
    } catch (error: any) {
      logger.error('Create waste category error:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          data: null,
          message: 'Category already exists',
          error: {
            code: 'CATEGORY_EXISTS',
            message: 'A waste category with this name already exists',
          },
        });
      }

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to create waste category',
        error: {
          code: 'CATEGORY_CREATION_ERROR',
          message: 'An error occurred while creating waste category',
        },
      });
    }
  }

  /**
   * Update waste category (Admin only)
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, unitOfMeasurement, pointsPerUnit, isActive } = req.body;

      const result = await db.query(
        `UPDATE waste_categories
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             unit_of_measurement = COALESCE($3, unit_of_measurement),
             points_per_unit = COALESCE($4, points_per_unit),
             is_active = COALESCE($5, is_active)
         WHERE id = $6
         RETURNING id, name, description, unit_of_measurement, points_per_unit, is_active, created_at`,
        [name, description, unitOfMeasurement, pointsPerUnit, isActive, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Waste category not found',
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'The specified waste category does not exist',
          },
        });
      }

      logger.info(`Waste category updated: ${id}`);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Waste category updated successfully',
      });
    } catch (error) {
      logger.error('Update waste category error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to update waste category',
        error: {
          code: 'CATEGORY_UPDATE_ERROR',
          message: 'An error occurred while updating waste category',
        },
      });
    }
  }

  /**
   * Delete waste category (Admin only - soft delete)
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `UPDATE waste_categories SET is_active = false WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Waste category not found',
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'The specified waste category does not exist',
          },
        });
      }

      logger.info(`Waste category deleted: ${id}`);

      res.json({
        success: true,
        data: null,
        message: 'Waste category deleted successfully',
      });
    } catch (error) {
      logger.error('Delete waste category error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to delete waste category',
        error: {
          code: 'CATEGORY_DELETION_ERROR',
          message: 'An error occurred while deleting waste category',
        },
      });
    }
  }
}
