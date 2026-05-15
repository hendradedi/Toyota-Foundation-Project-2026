import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { formatValidationErrors } from '@rt-muban/shared/src/utils/validation';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = validated.body;
      req.query = validated.query;
      req.params = validated.params;
      next();
    } catch (error: any) {
      if (error.errors) {
        const formattedErrors = formatValidationErrors(error);
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: formattedErrors,
          },
        });
      }
      next(error);
    }
  };
};
