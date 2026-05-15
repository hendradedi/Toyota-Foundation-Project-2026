import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '@rt-muban/shared/src/utils/logger';

/**
 * Validation middleware factory
 */
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error:', { errors, body: req.body });
        
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors,
          },
        });
      }
      next(error);
    }
  };
};

/**
 * Query validation middleware factory
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Query validation error:', { errors, query: req.query });
        
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Invalid query parameters',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors,
          },
        });
      }
      next(error);
    }
  };
};
