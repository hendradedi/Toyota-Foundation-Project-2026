import express, { Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { db } from '@rt-muban/shared';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Track product view
router.post(
  '/track/view/:productId',
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const userId = (req as any).user?.id;
      const { view_duration = 0 } = req.body;

      if (userId) {
        // Track view for logged-in user
        await db.query(
          `INSERT INTO product_views (user_id, product_id, view_duration) 
           VALUES ($1, $2, $3)`,
          [userId, productId, view_duration]
        );

        // Update interaction count
        await db.query(
          `INSERT INTO product_interactions (user_id, product_id, interaction_type) 
           VALUES ($1, $2, 'view')
           ON CONFLICT (user_id, product_id, interaction_type) 
           DO UPDATE SET 
             interaction_count = product_interactions.interaction_count + 1,
             last_interaction = NOW()`,
          [userId, productId]
        );
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Track product interaction
router.post(
  '/track/interaction',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { product_id, interaction_type } = req.body;

      if (!userId || !product_id || !interaction_type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await db.query(
        `INSERT INTO product_interactions (user_id, product_id, interaction_type) 
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id, interaction_type) 
         DO UPDATE SET 
           interaction_count = product_interactions.interaction_count + 1,
           last_interaction = NOW()`,
        [userId, product_id, interaction_type]
      );

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Track social share
router.post(
  '/track/share/:productId',
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const userId = (req as any).user?.id;
      const { platform } = req.body;

      if (!platform) {
        return res.status(400).json({ error: 'Platform is required' });
      }

      await db.query(
        `INSERT INTO social_shares (product_id, user_id, platform) 
         VALUES ($1, $2, $3)`,
        [productId, userId || null, platform]
      );

      if (userId) {
        await db.query(
          `INSERT INTO product_interactions (user_id, product_id, interaction_type) 
           VALUES ($1, $2, 'share')
           ON CONFLICT (user_id, product_id, interaction_type) 
           DO UPDATE SET 
             interaction_count = product_interactions.interaction_count + 1,
             last_interaction = NOW()`,
          [userId, productId]
        );
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get personalized recommendations
router.get(
  '/personalized',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { limit = 10 } = req.query;

      // Get user's interaction history
      const userInteractions = await db.query(
        `SELECT product_id, interaction_type, interaction_count 
         FROM product_interactions 
         WHERE user_id = $1 
         ORDER BY last_interaction DESC 
         LIMIT 50`,
        [userId]
      );

      if (userInteractions.rows.length === 0) {
        // Return trending products if no interaction history
        return getTrendingProducts(res, parseInt(limit as string));
      }

      // Get categories of products user has interacted with
      const interactedProducts = userInteractions.rows.map(i => i.product_id);
      const categoryResult = await db.query(
        `SELECT DISTINCT category FROM products WHERE id = ANY($1)`,
        [interactedProducts]
      );

      const categories = categoryResult.rows.map(r => r.category);

      // Get products from similar categories that user hasn't interacted with
      const recommendations = await db.query(
        `SELECT 
           p.*,
           b.name as business_name,
           b.avatar as business_avatar,
           COALESCE(rs.average_rating, 0) as average_rating,
           COALESCE(rs.total_reviews, 0) as total_reviews
         FROM products p
         LEFT JOIN marketplace_businesses b ON p.business_id = b.id
         LEFT JOIN product_ratings_summary rs ON p.id = rs.product_id
         WHERE p.category = ANY($1)
         AND p.id != ALL($2)
         AND p.stock_quantity > 0
         ORDER BY 
           rs.average_rating DESC NULLS LAST,
           p.created_at DESC
         LIMIT $3`,
        [categories, interactedProducts, limit]
      );

      res.status(200).json(recommendations.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Get trending products
router.get(
  '/trending',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit = 10, category } = req.query;

      let query = `
        SELECT 
          p.*,
          b.name as business_name,
          b.avatar as business_avatar,
          COALESCE(rs.average_rating, 0) as average_rating,
          COALESCE(rs.total_reviews, 0) as total_reviews,
          COALESCE(views.view_count, 0) as view_count
        FROM products p
        LEFT JOIN marketplace_businesses b ON p.business_id = b.id
        LEFT JOIN product_ratings_summary rs ON p.id = rs.product_id
        LEFT JOIN (
          SELECT product_id, COUNT(*) as view_count 
          FROM product_views 
          WHERE viewed_at > NOW() - INTERVAL '7 days'
          GROUP BY product_id
        ) views ON p.id = views.product_id
        WHERE p.stock_quantity > 0
      `;

      const params: any[] = [];

      if (category) {
        query += ` AND p.category = $1`;
        params.push(category);
      }

      query += `
        ORDER BY views.view_count DESC NULLS LAST, rs.average_rating DESC NULLS LAST
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const result = await db.query(query, params);

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Get similar products
router.get(
  '/similar/:productId',
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const { limit = 10 } = req.query;

      // Get product details
      const productResult = await db.query(
        `SELECT * FROM products WHERE id = $1`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const product = productResult.rows[0];

      // Get similar products by category and price range
      const result = await db.query(
        `SELECT 
           p.*,
           b.name as business_name,
           b.avatar as business_avatar,
           COALESCE(rs.average_rating, 0) as average_rating,
           COALESCE(rs.total_reviews, 0) as total_reviews
         FROM products p
         LEFT JOIN marketplace_businesses b ON p.business_id = b.id
         LEFT JOIN product_ratings_summary rs ON p.id = rs.product_id
         WHERE p.category = $1
         AND p.id != $2
         AND p.price BETWEEN $3 * 0.7 AND $3 * 1.3
         AND p.stock_quantity > 0
         ORDER BY 
           ABS(p.price - $3) ASC,
           rs.average_rating DESC NULLS LAST
         LIMIT $4`,
        [product.category, productId, product.price, limit]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Get frequently bought together
router.get(
  '/bought-together/:productId',
  param('productId').isUUID().withMessage('Invalid product ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const { limit = 5 } = req.query;

      // Find products frequently bought together
      const result = await db.query(
        `SELECT 
           p.*,
           b.name as business_name,
           b.avatar as business_avatar,
           COUNT(*) as frequency
         FROM marketplace_order_items oi1
         JOIN marketplace_order_items oi2 ON oi1.order_id = oi2.order_id AND oi2.product_id = $1
         JOIN products p ON oi1.product_id = p.id
         LEFT JOIN marketplace_businesses b ON p.business_id = b.id
         WHERE oi1.product_id != $1
         AND p.stock_quantity > 0
         GROUP BY p.id, b.id
         ORDER BY frequency DESC
         LIMIT $2`,
        [productId, limit]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Get recently viewed products
router.get(
  '/recently-viewed',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { limit = 10 } = req.query;

      const result = await db.query(
        `SELECT 
           p.*,
           b.name as business_name,
           b.avatar as business_avatar,
           pv.viewed_at
         FROM product_views pv
         JOIN products p ON pv.product_id = p.id
         LEFT JOIN marketplace_businesses b ON p.business_id = b.id
         WHERE pv.user_id = $1
         ORDER BY pv.viewed_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to get trending products
async function getTrendingProducts(res: Response, limit: number) {
  const result = await db.query(
    `SELECT 
       p.*,
       b.name as business_name,
       b.avatar as business_avatar,
       COALESCE(rs.average_rating, 0) as average_rating,
       COALESCE(rs.total_reviews, 0) as total_reviews
     FROM products p
     LEFT JOIN marketplace_businesses b ON p.business_id = b.id
     LEFT JOIN product_ratings_summary rs ON p.id = rs.product_id
     WHERE p.stock_quantity > 0
     ORDER BY rs.average_rating DESC NULLS LAST, p.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return res.status(200).json(result.rows);
}

export default router;
