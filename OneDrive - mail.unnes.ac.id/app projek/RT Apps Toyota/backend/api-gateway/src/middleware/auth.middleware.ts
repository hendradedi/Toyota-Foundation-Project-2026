import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '@rt-muban/shared/src/utils/jwt';
import logger from '@rt-muban/shared/src/utils/logger';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required',
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid token',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired',
        },
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Authentication error',
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication',
      },
    });
  }
};

// Optional auth middleware - attaches user if token present but doesn't require it
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const decoded = verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Token invalid but we continue anyway
        logger.warn('Optional auth: invalid token provided');
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

// Admin only middleware
export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Admin access required',
      error: {
        code: 'FORBIDDEN',
        message: 'This action requires admin privileges',
      },
    });
  }

  next();
};

// RT Leader or Admin middleware
export const rtLeaderOrAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.roles) {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Access denied',
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      },
    });
  }

  const { roles } = req.user;
  if (!roles.includes('admin') && !roles.includes('rt_leader')) {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Access denied',
      error: {
        code: 'FORBIDDEN',
        message: 'This action requires RT Leader or Admin privileges',
      },
    });
  }

  next();
};
