// Warung Service - Business Logic
import { db } from '@rt-muban/shared';
import { v4 as uuidv4 } from 'uuid';
import {
  Warung,
  WarungProduct,
  WarungOrder,
  WarungOrderItem,
  WarungReview,
  WarungApprovalHistory,
  WarungApplication,
  WarungCommunityScope,
  WarungStatus,
  WarungApprovalStatus,
  WarungProductCondition,
  WarungOrderStatus,
  WarungPaymentStatus,
  CreateWarungRequest,
  CreateWarungProductRequest,
  CreateWarungOrderRequest,
  CreateWarungReviewRequest,
  WarungServiceResponse,
} from '@rt-muban/shared/src/types/warung';
import { Op } from 'sequelize';
import logger from '@rt-muban/shared/src/utils/logger';

class WarungService {
  /**
   * Create a new warung application
   */
  static async createApplication(
    applicantId: string,
    applicantNeighborhoodId: string,
    data: CreateWarungRequest
  ): Promise<WarungApplication> {
    try {
      const applicationNumber = `WAR-2026-${uuidv4().substring(0, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const result = await db.query(
        `INSERT INTO warung_applications 
         (id, applicant_id, applicant_neighborhood_id, application_number, shop_name, 
          category, description, business_ownership_type, opening_date, 
          documentation, status, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'personal', $8, $9, 'submitted', $10, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          uuidv4(),
          applicantId,
          applicantNeighborhoodId,
          applicationNumber,
          data.shop_name,
          data.category,
          data.description,
          data.opening_date,
          data.documentation,
          expiresAt,
        ]
      );

      return result.rows[0] as WarungApplication;
    } catch (error) {
      logger.error('Error creating warung application:', error);
      throw error;
    }
  }

  /**
   * Get warung application by number
   */
  static async getApplicationByNumber(applicationNumber: string): Promise<WarungApplication | null> {
    const result = await db.query(
      `SELECT * FROM warung_applications WHERE application_number = $1`,
      [applicationNumber]
    );

    return result.rows[0] || null;
  }

  /**
   * Get warung application by applicant
   */
  static async getApplicationByApplicant(applicantId: string): Promise<WarungApplication | null> {
    const result = await db.query(
      `SELECT * FROM warung_applications WHERE applicant_id = $1 AND status = 'submitted'`,
      [applicantId]
    );

    return result.rows[0] || null;
  }

  /**
   * Approve a warung application and create warung
   */
  static async approveApplication(
    applicationId: string,
    approvedBy: string,
    reviewComment?: string
  ): Promise<WarungApplication & Warung> {
    try {
      const application = await this.getApplicationByNumber(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Check if already approved
      if (application.status === 'approved') {
        throw new Error('Application already approved');
      }

      // Calculate validity period (1 year)
      const now = new Date();
      const validityStart = new Date(now);
      const validityEnd = new Date(now);
      validityEnd.setFullYear(validityEnd.getFullYear() + 1);

      // Update application status
      await db.query(
        `UPDATE warung_applications 
         SET status = 'approved', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, 
             reviewer_comments = $3
         WHERE id = $1`,
        [applicationId, approvedBy, reviewComment]
      );

      // Create warung
      const warungResult = await db.query(
        `INSERT INTO warungs 
         (id, owner_id, neighborhood_id, community_scope, shop_name, description, 
          category, status, approval_status, approval_reason, approved_by, 
          approval_date, validity_start_date, validity_end_date, operating_hours, 
          phone_number, email, address, latitude, longitude, logo_url, 
          is_active, rating, total_reviews, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', 'approved', NULL, $8, 
               $9, $10, NULL, $11, NULL, NULL, $12, $13, $14, $15, true, 0, 0, 
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          uuidv4(),
          application.applicant_id,
          application.applicant_neighborhood_id,
          applicationNeighborhoodId,
          application.shop_name,
          application.description,
          application.category,
          reviewComment,
          validityStart,
          validityEnd,
          application.opening_date,
          application.documentation,
          application.opening_date,
          application.opening_date,
          application.opening_date,
          application.opening_date,
        ]
      );

      // Create approval history
      await db.query(
        `INSERT INTO warung_approval_history 
         (id, warung_id, previous_status, new_status, approval_decision, 
          decision_reason, approved_by, created_by, created_at)
         VALUES ($1, $2, 'submitted', 'approved', 'approved', $3, $4, $5, CURRENT_TIMESTAMP)`,
        [uuidv4(), warungResult.rows[0].id, reviewComment, approvedBy]
      );

      return {
        ...warungResult.rows[0],
        approval_history: [],
      };
    } catch (error) {
      logger.error('Error approving application:', error);
      throw error;
    }
  }

  /**
   * Reject a warung application
   */
  static async rejectApplication(
    applicationId: string,
    rejectedBy: string,
    reason: string
  ): Promise<WarungApplication> {
    const result = await db.query(
      `UPDATE warung_applications 
       SET status = 'rejected', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, 
           reviewer_comments = $3
       WHERE id = $1`,
      [applicationId, rejectedBy, reason]
    );

    const application = await this.getApplicationByNumber(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Create approval history
    await db.query(
      `INSERT INTO warung_approval_history 
       (id, warung_id, previous_status, new_status, approval_decision, 
        decision_reason, created_by, created_at)
       VALUES ($1, $2, 'submitted', 'rejected', 'rejected', $3, $4, CURRENT_TIMESTAMP)`,
      [uuidv4(), application.id, reason, rejectedBy]
    );

    return application;
  }

  /**
   * Get all warungs for a user
   */
  static async getUserWarungs(userId: string) {
    const result = await db.query(
      `SELECT w.*, 
             (SELECT COUNT(*) FROM warung_reviews WHERE warung_id = w.id) as review_count,
             (SELECT AVG(rating) FROM warung_reviews WHERE warung_id = w.id) as avg_rating,
             (SELECT COUNT(*) FROM warung_order_items WHERE product_id IN (
               SELECT product_id FROM warung_order_items WHERE order_id = wo.id
             )) as total_sold
       FROM warungs w
       WHERE w.owner_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );

    return result.rows
      .map((row: any) => ({
        ...row,
        approval_history: [],
      })) as Warung[];
  }

  /**
   * Get public warungs based on community scope
   */
  static async getPublicWarungs(
    buyerNeighborhoodId: string,
    scope: WarungCommunityScope = WarungCommunityScope.ALL_RT
  ) {
    let query = `
      SELECT w.*,
             (SELECT COUNT(*) FROM warung_reviews WHERE warung_id = w.id) as review_count,
             (SELECT AVG(CAST(rating AS numeric)) FROM warung_reviews WHERE warung_id = w.id) as avg_rating
       FROM warungs w
       WHERE w.is_active = true
         AND w.approval_status = 'approved'
         AND w.validity_end_date >= CURRENT_DATE
      `;
    const params: any[] = [];

    if (scope === WarungCommunityScope.RT_ONLY) {
      query += ` AND w.neighborhood_id = $${params.length + 1}`;
      params.push(buyerNeighborhoodId);
    } else if (scope === WarungCommunityScope.COMMUNITY) {
      // For community scope, include warungs in same Muban
      query += ` AND EXISTS (
        SELECT 1 FROM neighborhoods n 
        WHERE n.muban_id = w.neighborhood_id
          AND n.id = (
            SELECT neighborhood_id FROM households 
            WHERE head_of_household_id = (SELECT user_id FROM users WHERE id = $1)
          )
      )`;
      query += ` AND w.neighborhood_id = (SELECT neighborhood_id FROM households WHERE head_of_household_id = (SELECT user_id FROM users WHERE id = $1))`;
      params.push(buyerNeighborhoodId);
    }

    query += ` ORDER BY w.shop_name ASC`;

    const result = await db.query(query, [...params]);
    return result.rows as Warung[];
  }

  /**
   * Get warung details
   */
  static async getWarung(warungId: string) {
    const result = await db.query(
      `SELECT w.*,
             (SELECT COUNT(*) FROM warung_reviews WHERE warung_id = w.id) as review_count,
             (SELECT AVG(CAST(rating AS numeric)) FROM warung_reviews WHERE warung_id = w.id) as avg_rating
       FROM warungs w
       WHERE w.id = $1`,
      [warungId]
    );

    if (result.rows.length === 0) {
      throw new Error('Warung not found');
    }

    return result.rows[0];
  }

  /**
   * Create warung product
   */
  static async createWarungProduct(
    warungId: string,
    data: CreateWarungProductRequest
  ): Promise<WarungProduct> {
    try {
      const result = await db.query(
        `INSERT INTO warung_products 
         (id, warung_id, name, description, category, subcategory, brand, condition, 
          price, currency, stock_quantity, image_url, is_available, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, 
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          uuidv4(),
          warungId,
          data.name,
          data.description,
          data.category,
          data.subcategory,
          data.brand,
          data.condition,
          data.price,
          data.currency || 'IDR',
          data.stock_quantity,
          data.image_url,
        ]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating warung product:', error);
      throw error;
    }
  }

  /**
   * Get warung products
   */
  static async getWarungProducts(warungId: string) {
    const result = await db.query(
      `SELECT wp.*,
             (SELECT COUNT(*) FROM warung_reviews WHERE product_id = wp.id) as review_count,
             (SELECT AVG(CAST(rating AS numeric)) FROM warung_reviews WHERE product_id = wp.id) as avg_rating
       FROM warung_products wp
       WHERE wp.warung_id = $1
       ORDER BY wp.created_at DESC`,
      [warungId]
    );

    return result.rows as WarungProduct[];
  }

  /**
   * Check if warung is active
   */
  static async isWarungActive(warungId: string): Promise<boolean> {
    const result = await db.query(
      `SELECT approval_status, validity_end_date 
       FROM warungs 
       WHERE id = $1`,
      [warungId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const warung = result.rows[0];
    return (
      warung.approval_status === 'approved' &&
      warung.validity_end_date >= new Date() &&
      warung.is_active
    );
  }

  /**
   * Create warung order
   */
  static async createWarungOrder(
    data: CreateWarungOrderRequest
  ): Promise<WarungOrder & { items: WarungOrderItem[] }> {
    try {
      // Calculate order number
      const orderNumber = `WAR-2026-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Calculate total amount
      let totalAmount = 0;
      const orderItems: WarungOrderItem[] = [];

      for (const item of data.items) {
        const productResult = await db.query(
          `SELECT price, stock_quantity FROM warung_products WHERE id = $1`,
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error('Product not found');
        }

        const product = productResult.rows[0];
        if (product.stock_quantity < item.quantity) {
          throw new Error('Insufficient stock');
        }

        totalAmount += item.quantity * product.price;

        orderItems.push({
          id: uuidv4(),
          order_id: null, // Will be set after order creation
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.price,
          subtotal: item.quantity * product.price,
        });

        // Decrease stock
        await db.query(
          `UPDATE warung_products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      // Create order
      const orderResult = await db.query(
        `INSERT INTO warung_orders 
         (id, order_number, buyer_id, buyer_neighborhood_id, seller_warung_id, 
          seller_owner_id, total_amount, currency, status, payment_status, 
          payment_method, delivery_address, notes, delivery_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'unpaid', NULL, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          uuidv4(),
          orderNumber,
          data.buyer_id,
          data.buyer_neighborhood_id,
          data.seller_warung_id,
          data.seller_owner_id,
          totalAmount,
          data.currency || 'IDR',
          data.delivery_address,
          data.notes,
          data.delivery_date,
        ]
      );

      // Set order_id in order items
      const orderId = orderResult.rows[0].id;
      for (const item of orderItems) {
        await db.query(
          `UPDATE warung_order_items SET order_id = $1 WHERE id = $2`,
          [orderId, item.id]
        );
      }

      return {
        ...orderResult.rows[0],
        items: orderItems,
      };
    } catch (error) {
      logger.error('Error creating warung order:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  static async getUserOrders(userId: string, status?: string) {
    let query = `
      SELECT wo.*,
             (
               SELECT COUNT(*) FROM warung_order_items WHERE order_id = wo.id
             ) as item_count,
             (
               SELECT SUM(subtotal) FROM warung_order_items WHERE order_id = wo.id
             ) as total_items
       FROM warung_orders wo
       WHERE wo.buyer_id = $1
       `;
    const params: any[] = [userId];

    if (status) {
      query += ` AND wo.status = $${params.length}`;
      params.push(status);
    }

    query += ` ORDER BY wo.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows as WarungOrder[];
  }

  /**
   * Get seller orders
   */
  static async getSellerOrders(sellerWarungId: string) {
    const result = await db.query(
      `SELECT wo.*,
             (
               SELECT COUNT(*) FROM warung_order_items WHERE order_id = wo.id
             ) as item_count
       FROM warung_orders wo
       WHERE wo.seller_warung_id = $1
       ORDER BY wo.created_at DESC`,
      [sellerWarungId]
    );

    return result.rows as WarungOrder[];
  }

  /**
   * Get order details
   */
  static async getOrder(orderId: string) {
    const result = await db.query(
      `SELECT wo.*,
             GROUP_CONCAT(oi.product_id) as product_ids
       FROM warung_orders wo
       LEFT JOIN warung_order_items oi ON wo.id = oi.order_id
       WHERE wo.id = $1
       GROUP BY wo.id`,
      [orderId]
    );

    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = result.rows[0];
    const items = await db.query(
      `SELECT * FROM warung_order_items WHERE order_id = $1`,
      [orderId]
    );

    return {
      ...order,
      items: items.rows as WarungOrderItem[],
    };
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: WarungOrderStatus,
    sellerWarungId: string
  ) {
    const result = await db.query(
      `UPDATE warung_orders 
       SET status = $2
       WHERE id = $1 AND seller_warung_id = $3`,
      [orderId, status, sellerWarungId]
    );

    if (result.rows.length === 0) {
      throw new Error('Order not found or does not belong to seller');
    }
  }

  /**
   * Create warung review
   */
  static async createWarungReview(
    data: CreateWarungReviewRequest,
    warungId: string
  ): Promise<WarungReview> {
    try {
      const result = await db.query(
        `INSERT INTO warung_reviews 
         (id, reviewer_id, warung_id, product_id, rating, comment, is_verified_purchase, 
          created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          uuidv4(),
          data.reviewer_id,
          warungId,
          data.product_id,
          data.rating,
          data.comment,
        ]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating warung review:', error);
      throw error;
    }
  }

  /**
   * Get warung reviews
   */
  static async getWarungReviews(warungId: string) {
    const result = await db.query(
      `SELECT wr.*,
             (SELECT COUNT(*) FROM warung_reviews WHERE reviewer_id = wr.reviewer_id) as review_count
       FROM warung_reviews wr
       WHERE wr.warung_id = $1
       ORDER BY wr.created_at DESC`,
      [warungId]
    );

    return result.rows as WarungReview[];
  }

  /**
   * Get approval history
   */
  static async getApprovalHistory(warungId: string) {
    const result = await db.query(
      `SELECT * FROM warung_approval_history WHERE warung_id = $1 ORDER BY approved_at DESC`,
      [warungId]
    );

    return result.rows as WarungApprovalHistory[];
  }

  /**
   * Update warung
   */
  static async updateWarung(warungId: string, data: UpdateWarungRequest) {
    const setClauses: string[] = [];
    const params: any[] = [];
    params.push(warungId);

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        setClauses.push(`w.${key} = $${params.length}`);
        params.push(value);
      }
    }

    if (data.is_active !== undefined) {
      setClauses.push(`w.is_active = $${params.length}`);
      params.push(data.is_active);
    }

    if (setClauses.length === 0) {
      throw new Error('No data to update');
    }

    await db.query(
      `UPDATE warungs SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
      [...params]
    );
  }

  /**
   * Get warung analytics
   */
  static async getAnalytics(neighborhoodId: string) {
    const result = await db.query(
      `SELECT
        COUNT(DISTINCT w.id) as total_warungs,
        SUM(CASE WHEN w.status = 'approved' THEN 1 ELSE 0 END) as active_warungs,
        SUM(CASE WHEN w.approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approval,
        COUNT(DISTINCT wp.id) as total_products,
        COUNT(DISTINCT wo.id) as total_orders,
        COALESCE(SUM(wo.total_amount), 0) as total_revenue,
        AVG(CASE WHEN wr.rating IS NOT NULL THEN wr.rating END) as average_rating
       FROM warungs w
       LEFT JOIN warung_products wp ON w.id = wp.warung_id
       LEFT JOIN warung_orders wo ON EXISTS (
         SELECT 1 FROM warung_order_items ooi 
         WHERE ooi.order_id = wo.id AND ooi.product_id = wp.id
       )
       LEFT JOIN warung_reviews wr ON w.id = wr.warung_id
       WHERE w.neighborhood_id = $1
       GROUP BY 1`,
      [neighborhoodId]
    );

    const row = result.rows[0];

    // Get by category
    const categoryResult = await db.query(
      `SELECT category, COUNT(*) as count 
       FROM warungs 
       WHERE neighborhood_id = $1
       GROUP BY category`,
      [neighborhoodId]
    );
    const byCategory = categoryResult.rows.reduce(
      (acc: Record<string, number>, row: any) => {
        acc[row.category] = (acc[row.category] || 0) + row.count;
        return acc;
      },
      {}
    );

    // Get by scope
    const scopeResult = await db.query(
      `SELECT community_scope, COUNT(*) as count 
       FROM warungs 
       WHERE neighborhood_id = $1
       GROUP BY community_scope`,
      [neighborhoodId]
    );
    const byScope = scopeResult.rows.reduce(
      (acc: Record<string, number>, row: any) => {
        acc[row.community_scope] = (acc[row.community_scope] || 0) + row.count;
        return acc;
      },
      {}
    );

    return {
      total_warungs: row.total_warungs || 0,
      active_warungs: row.active_warungs || 0,
      pending_approval: row.pending_approval || 0,
      total_products: row.total_products || 0,
      total_orders: row.total_orders || 0,
      total_revenue: row.total_revenue || 0,
      average_rating: row.average_rating || 0,
      by_category,
      by_scope,
    } as WarungAnalytics;
  }

  /**
   * Check if buyer can see a warung based on community scope
   */
  static async canBuyFromWarung(
    buyerNeighborhoodId: string,
    warungId: string
  ): Promise<boolean> {
    const warung = await this.getWarung(warungId);
    if (!warung || !warung.is_active) {
      return false;
    }

    if (warung.community_scope === WarungCommunityScope.ALL_RT) {
      return true;
    }

    if (warung.community_scope === WarungCommunityScope.RT_ONLY) {
      return warung.neighborhood_id === buyerNeighborhoodId;
    }

    // COMMUNITY scope - check if in same Muban
    const buyerResult = await db.query(
      `SELECT neighborhood_id FROM households WHERE head_of_household_id = (
        SELECT user_id FROM users WHERE id = $1
      )`,
      [buyerNeighborhoodId]
    );

    if (buyerResult.rows.length === 0) {
      return false;
    }

    const buyerHousehold = buyerResult.rows[0];
    const warungHouseholdResult = await db.query(
      `SELECT n.muban_id FROM neighborhoods n 
       JOIN households h ON n.id = h.neighborhood_id
       WHERE h.head_of_household_id = (
         SELECT user_id FROM users WHERE id = (
           SELECT owner_id FROM warungs WHERE id = $2
         )
       )`,
      [warungId]
    );

    if (warungHouseholdResult.rows.length === 0) {
      return false;
    }

    return buyerHousehold.neighborhood_id.muban_id === warungHouseholdResult.rows[0].muban_id;
  }

  /**
   * Check if warung is expired
   */
  static async isWarungExpired(warungId: string): Promise<boolean> {
    const result = await db.query(
      `SELECT validity_end_date FROM warungs WHERE id = $1`,
      [warungId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return new Date(result.rows[0].validity_end_date) < new Date();
  }
}

export default WarungService;
