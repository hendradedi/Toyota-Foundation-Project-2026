import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db } from '@rt-muban/shared';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Validation middleware
const validateWishlistItem = [
  body('product_id').isUUID().withMessage('Invalid product ID'),
  body('business_id').optional().isUUID().withMessage('Invalid business ID'),
];

// Add to wishlist
router.post(
  '/',
  authenticateToken,
  validateWishlistItem,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { product_id, business_id } = req.body;

      // Check if already in wishlist
      const existing = await db.query(
        `SELECT * FROM wishlists WHERE user_id = $1 AND product_id = $2`,
        [userId, product_id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Product already in wishlist' });
      }

      // Add to wishlist
      const result = await db.query(
        `INSERT INTO wishlists (user_id, product_id, business_id) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [userId, product_id, business_id || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Remove from wishlist
router.delete(
  '/:productId',
  authenticateToken,
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { productId } = req.params;

      const result = await db.query(
        `DELETE FROM wishlists 
         WHERE user_id = $1 AND product_id = $2 
         RETURNING *`,
        [userId, productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not in wishlist' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's wishlist
router.get(
  '/',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await db.query(
        `SELECT 
           w.*,
           p.name as product_name,
           p.description as product_description,
           p.price,
           p.stock_quantity,
           p.images,
           b.name as business_name,
           b.avatar as business_avatar
         FROM wishlists w
         LEFT JOIN products p ON w.product_id = p.id
         LEFT JOIN marketplace_businesses b ON w.business_id = b.id
         WHERE w.user_id = $1
         ORDER BY w.added_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Check if product is in wishlist
router.get(
  '/:productId/check',
  authenticateToken,
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { productId } = req.params;

      const result = await db.query(
        `SELECT * FROM wishlists WHERE user_id = $1 AND product_id = $2`,
        [userId, productId]
      );

      res.status(200).json({ inWishlist: result.rows.length > 0 });
    } catch (error) {
      next(error);
    }
  }
);

// Get wishlist count
router.get(
  '/count',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;

      const result = await db.query(
        `SELECT COUNT(*) as total FROM wishlists WHERE user_id = $1`,
        [userId]
      );

      res.status(200).json({ total: parseInt(result.rows[0].total) });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
