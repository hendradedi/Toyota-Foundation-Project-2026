import { Request, Response } from 'express';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate registration code for neighborhood
 * Admin endpoint to create a shareable code for user registration
 */
export class NeighborhoodController {
  /**
   * Generate registration code for a neighborhood
   * POST /api/neighborhoods/{id}/generate-code
   */
  async generateRegistrationCode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { prefix, length } = req.body;

      // Verify neighborhood exists
      const neighborhoodResult = await db.query(
        'SELECT id, name FROM neighborhoods WHERE id = $1',
        [id]
      );

      if (neighborhoodResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Neighborhood not found',
          error: { code: 'NOT_FOUND' },
        });
      }

      const neighborhood = neighborhoodResult.rows[0];

      // Generate code
      const codeLength = length || 6;
      const codePrefix = prefix || 'RT';
      let code = codePrefix;

      // Add random alphanumeric suffix
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      for (let i = 0; i < codeLength; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists (retry if needed)
      let attempts = 0;
      while (attempts < 5) {
        const existingCode = await db.query(
          'SELECT id FROM neighborhoods WHERE registration_code = $1',
          [code]
        );

        if (existingCode.rows.length === 0) {
          break;
        }

        // Regenerate if duplicate
        code = codePrefix;
        for (let i = 0; i < codeLength; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        attempts++;
      }

      // Update neighborhood with new code
      const updateResult = await db.query(
        `UPDATE neighborhoods 
         SET registration_code = $1, registration_code_generated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, name, registration_code, registration_code_generated_at`,
        [code, id]
      );

      const updatedNeighborhood = updateResult.rows[0];

      logger.info(`Registration code generated for neighborhood: ${neighborhood.name}`, {
        neighborhoodId: id,
        registrationCode: code,
      });

      return res.status(200).json({
        success: true,
        data: {
          neighborhood: {
            id: updatedNeighborhood.id,
            name: updatedNeighborhood.name,
            registrationCode: updatedNeighborhood.registration_code,
            generatedAt: updatedNeighborhood.registration_code_generated_at,
          },
        },
        message: 'Registration code generated successfully',
      });
    } catch (error) {
      logger.error('Error generating registration code:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to generate registration code',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  /**
   * Get registration code for a neighborhood
   * GET /api/neighborhoods/{id}/registration-code
   */
  async getRegistrationCode(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT id, name, registration_code, registration_code_generated_at
         FROM neighborhoods WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Neighborhood not found',
          error: { code: 'NOT_FOUND' },
        });
      }

      const neighborhood = result.rows[0];

      return res.status(200).json({
        success: true,
        data: {
          neighborhood: {
            id: neighborhood.id,
            name: neighborhood.name,
            registrationCode: neighborhood.registration_code,
            generatedAt: neighborhood.registration_code_generated_at,
          },
        },
        message: 'Registration code retrieved successfully',
      });
    } catch (error) {
      logger.error('Error retrieving registration code:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve registration code',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  /**
   * Get neighborhood info by registration code
   * GET /api/neighborhoods/by-code/{code}
   * Public endpoint - no auth required (for registration flow)
   */
  async getNeighborhoodByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const result = await db.query(
        `SELECT id, name, type, country, province, city, description
         FROM neighborhoods 
         WHERE registration_code = $1 AND is_active = true`,
        [code]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Neighborhood not found',
          error: { code: 'NOT_FOUND' },
        });
      }

      const neighborhood = result.rows[0];

      return res.status(200).json({
        success: true,
        data: {
          neighborhood,
        },
        message: 'Neighborhood retrieved successfully',
      });
    } catch (error) {
      logger.error('Error retrieving neighborhood by code:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve neighborhood',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  /**
   * Get user count for a neighborhood
   * GET /api/neighborhoods/{id}/user-count
   */
  async getUserCount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT COUNT(*) as user_count FROM users WHERE neighborhood_id = $1`,
        [id]
      );

      return res.status(200).json({
        success: true,
        data: {
          neighborhoodId: id,
          userCount: parseInt(result.rows[0].user_count),
        },
        message: 'User count retrieved successfully',
      });
    } catch (error) {
      logger.error('Error retrieving user count:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve user count',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }
}

export default new NeighborhoodController();
