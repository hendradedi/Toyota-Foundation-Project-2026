import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db } from '@rt-muban/shared';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Validation middleware
const validateReview = [
  body('product_id').isUUID().withMessage('Invalid product ID'),
  body('order_id').isUUID().withMessage('Invalid order ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 255 }).withMessage('Title too long'),
  body('comment').optional().trim().isLength({ max: 5000 }).withMessage('Comment too long'),
];

const validateReviewResponse = [
  param('reviewId').isUUID().withMessage('Invalid review ID'),
  body('response').trim().notEmpty().withMessage('Response cannot be empty'),
];

// Create review
router.post(
  '/',
  authenticateToken,
  validateReview,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { product_id, order_id, rating, title, comment, images } = req.body;

      // Verify order belongs to user
      const orderResult = await db.query(
        `SELECT * FROM marketplace_orders WHERE id = $1 AND user_id = $2`,
        [order_id, userId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Check if review already exists
      const existingReview = await db.query(
        `SELECT * FROM enhanced_reviews WHERE product_id = $1 AND order_id = $2`,
        [product_id, order_id]
      );

      if (existingReview.rows.length > 0) {
        return res.status(400).json({ error: 'Review already exists for this order' });
      }

      // Create review
      const result = await db.query(
        `INSERT INTO enhanced_reviews 
         (product_id, order_id, user_id, rating, title, comment, images) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [product_id, order_id, userId, rating, title || null, comment || null, JSON.stringify(images || [])]
      );

      // Update product ratings summary
      await updateProductRatings(product_id);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Get product reviews
router.get(
  '/product/:productId',
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const { limit = 20, offset = 0, sort = 'recent' } = req.query;

      let orderBy = 'r.created_at DESC';
      if (sort === 'helpful') {
        orderBy = '(r.helpful_count - r.unhelpful_count) DESC';
      } else if (sort === 'rating_high') {
        orderBy = 'r.rating DESC';
      } else if (sort === 'rating_low') {
        orderBy = 'r.rating ASC';
      }

      const result = await db.query(
        `SELECT 
           r.*,
           u.first_name,
           u.last_name,
           u.avatar
         FROM enhanced_reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.product_id = $1
         ORDER BY ${orderBy}
         LIMIT $2 OFFSET $3`,
        [productId, limit, offset]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Get review by ID
router.get(
  '/:reviewId',
  param('reviewId').isUUID().withMessage('Invalid review ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reviewId } = req.params;

      const result = await db.query(
        `SELECT 
           r.*,
           u.first_name,
           u.last_name,
           u.avatar
         FROM enhanced_reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.id = $1`,
        [reviewId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Update review
router.put(
  '/:reviewId',
  authenticateToken,
  param('reviewId').isUUID().withMessage('Invalid review ID'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 255 }).withMessage('Title too long'),
  body('comment').optional().trim().isLength({ max: 5000 }).withMessage('Comment too long'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { reviewId } = req.params;
      const { rating, title, comment, images } = req.body;

      // Verify review belongs to user
      const reviewResult = await db.query(
        `SELECT * FROM enhanced_reviews WHERE id = $1 AND user_id = $2`,
        [reviewId, userId]
      );

      if (reviewResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const review = reviewResult.rows[0];

      // Update review
      const result = await db.query(
        `UPDATE enhanced_reviews 
         SET rating = COALESCE($1, rating),
             title = COALESCE($2, title),
             comment = COALESCE($3, comment),
             images = COALESCE($4, images),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [rating || null, title || null, comment || null, images ? JSON.stringify(images) : null, reviewId]
      );

      // Update product ratings if rating changed
      if (rating && rating !== review.rating) {
        await updateProductRatings(review.product_id);
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Delete review
router.delete(
  '/:reviewId',
  authenticateToken,
  param('reviewId').isUUID().withMessage('Invalid review ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { reviewId } = req.params;

      // Verify review belongs to user
      const reviewResult = await db.query(
        `SELECT * FROM enhanced_reviews WHERE id = $1 AND user_id = $2`,
        [reviewId, userId]
      );

      if (reviewResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const review = reviewResult.rows[0];

      // Delete review
      await db.query(`DELETE FROM enhanced_reviews WHERE id = $1`, [reviewId]);

      // Update product ratings
      await updateProductRatings(review.product_id);

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Mark review as helpful
router.post(
  '/:reviewId/helpful',
  authenticateToken,
  param('reviewId').isUUID().withMessage('Invalid review ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reviewId } = req.params;

      const result = await db.query(
        `UPDATE enhanced_reviews 
         SET helpful_count = helpful_count + 1 
         WHERE id = $1 
         RETURNING *`,
        [reviewId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Mark review as unhelpful
router.post(
  '/:reviewId/unhelpful',
  authenticateToken,
  param('reviewId').isUUID().withMessage('Invalid review ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reviewId } = req.params;

      const result = await db.query(
        `UPDATE enhanced_reviews 
         SET unhelpful_count = unhelpful_count + 1 
         WHERE id = $1 
         RETURNING *`,
        [reviewId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Add seller response to review
router.post(
  '/:reviewId/response',
  authenticateToken,
  validateReviewResponse,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { reviewId } = req.params;
      const { response } = req.body;

      // Get review and verify seller owns the product
      const reviewResult = await db.query(
        `SELECT r.*, p.business_id 
         FROM enhanced_reviews r
         JOIN products p ON r.product_id = p.id
         WHERE r.id = $1`,
        [reviewId]
      );

      if (reviewResult.rows.length === 0) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const review = reviewResult.rows[0];

      // Verify user is the seller
      const businessResult = await db.query(
        `SELECT * FROM marketplace_businesses WHERE id = $1 AND owner_id = $2`,
        [review.business_id, userId]
      );

      if (businessResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Add response
      const result = await db.query(
        `UPDATE enhanced_reviews 
         SET seller_response = $1, seller_response_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [response, reviewId]
      );

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Get product ratings summary
router.get(
  '/summary/:productId',
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;

      const result = await db.query(
        `SELECT * FROM product_ratings_summary WHERE product_id = $1`,
        [productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No ratings found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to update product ratings
async function updateProductRatings(productId: string) {
  try {
    const result = await db.query(
      `SELECT 
         AVG(rating)::DECIMAL(3,2) as average_rating,
         COUNT(*) as total_reviews,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5
       FROM enhanced_reviews
       WHERE product_id = $1`,
      [productId]
    );

    const stats = result.rows[0];
    const distribution = {
      '1': stats.rating_1 || 0,
      '2': stats.rating_2 || 0,
      '3': stats.rating_3 || 0,
      '4': stats.rating_4 || 0,
      '5': stats.rating_5 || 0,
    };

    await db.query(
      `INSERT INTO product_ratings_summary 
       (product_id, average_rating, total_reviews, rating_distribution) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id) DO UPDATE SET
       average_rating = $2,
       total_reviews = $3,
       rating_distribution = $4,
       updated_at = NOW()`,
      [productId, stats.average_rating || 0, stats.total_reviews || 0, JSON.stringify(distribution)]
    );
  } catch (error) {
    console.error('Error updating product ratings:', error);
  }
}

export default router;
