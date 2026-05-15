import { Request, Response, NextFunction } from 'express';
import logger from '@rt-muban/shared/src/utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Global error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred:', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
  });

  // Default to 500 if no status code provided
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: {
      code,
      details: err.details || {},
    },
  });
};

// Catch-all middleware for 404 errors
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, 'NOT_FOUND', `Cannot ${req.method} ${req.path}`);
  next(error);
};

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default { errorHandler, notFoundHandler, asyncHandler };
