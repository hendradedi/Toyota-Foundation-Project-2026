import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db } from '@rt-muban/shared';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = express.Router();

// Validation middleware
const validateConversation = [
  body('participant_id').isUUID().withMessage('Invalid participant ID'),
  body('business_id').optional().isUUID().withMessage('Invalid business ID'),
  body('order_id').optional().isUUID().withMessage('Invalid order ID'),
];

const validateMessage = [
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
  body('message').trim().notEmpty().withMessage('Message cannot be empty'),
  body('message_type')
    .optional()
    .isIn(['text', 'image', 'file', 'order', 'product'])
    .withMessage('Invalid message type'),
  body('attachment_url').optional().isURL().withMessage('Invalid attachment URL'),
];

// Get or create conversation
router.post(
  '/conversations',
  authenticateToken,
  validateConversation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { participant_id, business_id, order_id } = req.body;

      // Ensure participant1_id < participant2_id for consistency
      const [participant1_id, participant2_id] = [userId, participant_id].sort();

      // Check if conversation already exists
      let conversation = await db.query(
        `SELECT * FROM chat_conversations 
         WHERE participant1_id = $1 AND participant2_id = $2 
         AND (business_id = $3 OR ($3 IS NULL AND business_id IS NULL))`,
        [participant1_id, participant2_id, business_id || null]
      );

      if (conversation.rows.length > 0) {
        return res.status(200).json(conversation.rows[0]);
      }

      // Create new conversation
      const result = await db.query(
        `INSERT INTO chat_conversations 
         (participant1_id, participant2_id, business_id, order_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [participant1_id, participant2_id, business_id || null, order_id || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Get user's conversations
router.get(
  '/conversations',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await db.query(
        `SELECT 
           c.*,
           u1.first_name as participant1_first_name,
           u1.last_name as participant1_last_name,
           u1.avatar as participant1_avatar,
           u2.first_name as participant2_first_name,
           u2.last_name as participant2_last_name,
           u2.avatar as participant2_avatar,
           b.name as business_name
         FROM chat_conversations c
         LEFT JOIN users u1 ON c.participant1_id = u1.id
         LEFT JOIN users u2 ON c.participant2_id = u2.id
         LEFT JOIN marketplace_businesses b ON c.business_id = b.id
         WHERE c.participant1_id = $1 OR c.participant2_id = $1
         ORDER BY c.last_message_at DESC NULLS LAST
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Get conversation by ID
router.get(
  '/conversations/:conversationId',
  authenticateToken,
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { conversationId } = req.params;

      const result = await db.query(
        `SELECT * FROM chat_conversations 
         WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
        [conversationId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Send message
router.post(
  '/conversations/:conversationId/messages',
  authenticateToken,
  validateMessage,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { conversationId } = req.params;
      const { message, message_type = 'text', attachment_url, attachment_name } = req.body;

      // Verify user is part of conversation
      const convResult = await db.query(
        `SELECT * FROM chat_conversations 
         WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
        [conversationId, userId]
      );

      if (convResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const conversation = convResult.rows[0];

      // Insert message
      const msgResult = await db.query(
        `INSERT INTO chat_messages 
         (conversation_id, sender_id, message, message_type, attachment_url, attachment_name) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [conversationId, userId, message, message_type, attachment_url || null, attachment_name || null]
      );

      // Update conversation's last message
      const recipientId = conversation.participant1_id === userId 
        ? conversation.participant2_id 
        : conversation.participant1_id;

      await db.query(
        `UPDATE chat_conversations 
         SET last_message = $1, 
             last_message_at = NOW(), 
             last_message_sender_id = $2,
             unread_count_participant${conversation.participant1_id === recipientId ? '1' : '2'} = unread_count_participant${conversation.participant1_id === recipientId ? '1' : '2'} + 1
         WHERE id = $3`,
        [message, userId, conversationId]
      );

      res.status(201).json(msgResult.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Get messages in conversation
router.get(
  '/conversations/:conversationId/messages',
  authenticateToken,
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { conversationId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Verify user is part of conversation
      const convResult = await db.query(
        `SELECT * FROM chat_conversations 
         WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
        [conversationId, userId]
      );

      if (convResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const result = await db.query(
        `SELECT 
           m.*,
           u.first_name,
           u.last_name,
           u.avatar
         FROM chat_messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [conversationId, limit, offset]
      );

      res.status(200).json(result.rows.reverse());
    } catch (error) {
      next(error);
    }
  }
);

// Mark messages as read
router.patch(
  '/conversations/:conversationId/read',
  authenticateToken,
  param('conversationId').isUUID().withMessage('Invalid conversation ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { conversationId } = req.params;

      // Verify user is part of conversation
      const convResult = await db.query(
        `SELECT * FROM chat_conversations 
         WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
        [conversationId, userId]
      );

      if (convResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const conversation = convResult.rows[0];

      // Mark messages as read
      await db.query(
        `UPDATE chat_messages 
         SET is_read = TRUE, read_at = NOW() 
         WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
        [conversationId, userId]
      );

      // Reset unread count
      const unreadField = conversation.participant1_id === userId 
        ? 'unread_count_participant1' 
        : 'unread_count_participant2';

      await db.query(
        `UPDATE chat_conversations 
         SET ${unreadField} = 0 
         WHERE id = $1`,
        [conversationId]
      );

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get notifications
router.get(
  '/notifications',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { limit = 20, offset = 0, unread_only = false } = req.query;

      let query = `SELECT * FROM notifications WHERE user_id = $1`;
      const params: any[] = [userId];

      if (unread_only === 'true') {
        query += ` AND is_read = FALSE`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read',
  authenticateToken,
  param('notificationId').isUUID().withMessage('Invalid notification ID'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const { notificationId } = req.params;

      const result = await db.query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = NOW() 
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Mark all notifications as read
router.patch(
  '/notifications/read-all',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;

      await db.query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = NOW() 
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get notification preferences
router.get(
  '/preferences',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;

      let result = await db.query(
        `SELECT * FROM notification_preferences WHERE user_id = $1`,
        [userId]
      );

      // Create default preferences if not exists
      if (result.rows.length === 0) {
        result = await db.query(
          `INSERT INTO notification_preferences (user_id) 
           VALUES ($1) 
           RETURNING *`,
          [userId]
        );
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Update notification preferences
router.patch(
  '/preferences',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const {
        push_enabled,
        email_enabled,
        sms_enabled,
        order_notifications,
        message_notifications,
        promo_notifications,
        system_notifications,
      } = req.body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (push_enabled !== undefined) {
        updates.push(`push_enabled = $${paramIndex++}`);
        params.push(push_enabled);
      }
      if (email_enabled !== undefined) {
        updates.push(`email_enabled = $${paramIndex++}`);
        params.push(email_enabled);
      }
      if (sms_enabled !== undefined) {
        updates.push(`sms_enabled = $${paramIndex++}`);
        params.push(sms_enabled);
      }
      if (order_notifications !== undefined) {
        updates.push(`order_notifications = $${paramIndex++}`);
        params.push(order_notifications);
      }
      if (message_notifications !== undefined) {
        updates.push(`message_notifications = $${paramIndex++}`);
        params.push(message_notifications);
      }
      if (promo_notifications !== undefined) {
        updates.push(`promo_notifications = $${paramIndex++}`);
        params.push(promo_notifications);
      }
      if (system_notifications !== undefined) {
        updates.push(`system_notifications = $${paramIndex++}`);
        params.push(system_notifications);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      params.push(userId);

      const result = await db.query(
        `UPDATE notification_preferences 
         SET ${updates.join(', ')} 
         WHERE user_id = $${paramIndex} 
         RETURNING *`,
        params
      );

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
