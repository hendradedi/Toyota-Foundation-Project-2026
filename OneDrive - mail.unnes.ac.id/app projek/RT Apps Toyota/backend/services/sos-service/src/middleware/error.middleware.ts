import { Request, Response, NextFunction } from 'express';
import logger from '@rt-muban/shared/src/utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};
