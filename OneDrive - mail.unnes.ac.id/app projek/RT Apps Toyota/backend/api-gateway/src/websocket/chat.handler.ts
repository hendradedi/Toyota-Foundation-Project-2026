import { Socket } from 'socket.io';
import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';

export class ChatWebSocketHandler {
  /**
   * Setup chat-specific event handlers for a socket
   */
  static setupHandlers(socket: Socket): void {
    const userId = socket.data.userId;

    // Join conversation room
    socket.on('chat:join-conversation', async (conversationId: string) => {
      try {
        // Verify user is part of conversation
        const result = await db.query(
          `SELECT * FROM chat_conversations 
           WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
          [conversationId, userId]
        );

        if (result.rows.length === 0) {
          socket.emit('chat:error', {
            code: 'UNAUTHORIZED',
            message: 'You are not part of this conversation',
          });
          return;
        }

        // Join the conversation room
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined conversation ${conversationId}`);

        socket.emit('chat:joined-conversation', { conversationId });
      } catch (error) {
        logger.error('Error joining conversation:', error);
        socket.emit('chat:error', {
          code: 'JOIN_FAILED',
          message: 'Failed to join conversation',
        });
      }
    });

    // Leave conversation room
    socket.on('chat:leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${userId} left conversation ${conversationId}`);
      socket.emit('chat:left-conversation', { conversationId });
    });

    // Send message (real-time broadcast)
    socket.on('chat:send-message', async (data: {
      conversationId: string;
      message: string;
      messageType?: string;
      attachmentUrl?: string;
      attachmentName?: string;
    }) => {
      try {
        const { conversationId, message, messageType = 'text', attachmentUrl, attachmentName } = data;

        // Verify user is part of conversation
        const convResult = await db.query(
          `SELECT * FROM chat_conversations 
           WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
          [conversationId, userId]
        );

        if (convResult.rows.length === 0) {
          socket.emit('chat:error', {
            code: 'UNAUTHORIZED',
            message: 'You are not part of this conversation',
          });
          return;
        }

        const conversation = convResult.rows[0];

        // Insert message
        const msgResult = await db.query(
          `INSERT INTO chat_messages 
           (conversation_id, sender_id, message, message_type, attachment_url, attachment_name) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [conversationId, userId, message, messageType, attachmentUrl || null, attachmentName || null]
        );

        const newMessage = msgResult.rows[0];

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

        // Get sender info
        const userResult = await db.query(
          `SELECT id, first_name, last_name, avatar FROM users WHERE id = $1`,
          [userId]
        );

        const messageWithSender = {
          ...newMessage,
          sender: userResult.rows[0],
        };

        // Broadcast to conversation room
        socket.to(`conversation:${conversationId}`).emit('chat:new-message', messageWithSender);
        
        // Also send to recipient's user room for notification
        socket.to(`user:${recipientId}`).emit('chat:message-notification', {
          conversationId,
          message: messageWithSender,
        });

        // Confirm to sender
        socket.emit('chat:message-sent', messageWithSender);

        logger.info(`Message sent in conversation ${conversationId} by user ${userId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('chat:error', {
          code: 'SEND_FAILED',
          message: 'Failed to send message',
        });
      }
    });

    // Typing indicator
    socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation:${conversationId}`).emit('chat:user-typing', {
        userId,
        conversationId,
        isTyping,
      });
    });

    // Mark messages as read
    socket.on('chat:mark-read', async (conversationId: string) => {
      try {
        // Verify user is part of conversation
        const convResult = await db.query(
          `SELECT * FROM chat_conversations 
           WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
          [conversationId, userId]
        );

        if (convResult.rows.length === 0) {
          return;
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

        // Notify other participant
        const recipientId = conversation.participant1_id === userId 
          ? conversation.participant2_id 
          : conversation.participant1_id;

        socket.to(`user:${recipientId}`).emit('chat:messages-read', {
          conversationId,
          readBy: userId,
        });

        socket.emit('chat:marked-read', { conversationId });
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    });
  }

  /**
   * Send notification to user
   */
  static async sendNotification(
    io: any,
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: any;
      referenceId?: string;
      referenceType?: string;
    }
  ): Promise<void> {
    try {
      // Save notification to database
      const result = await db.query(
        `INSERT INTO notifications 
         (user_id, type, title, message, data, reference_id, reference_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          userId,
          notification.type,
          notification.title,
          notification.message,
          JSON.stringify(notification.data || {}),
          notification.referenceId || null,
          notification.referenceType || null,
        ]
      );

      // Send via WebSocket
      io.to(`user:${userId}`).emit('notification:new', result.rows[0]);

      logger.info(`Notification sent to user ${userId}: ${notification.type}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Broadcast order update to seller
   */
  static async notifyOrderUpdate(
    io: any,
    sellerId: string,
    orderId: string,
    status: string
  ): Promise<void> {
    try {
      const orderResult = await db.query(
        `SELECT o.*, u.first_name, u.last_name 
         FROM marketplace_orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) return;

      const order = orderResult.rows[0];

      await ChatWebSocketHandler.sendNotification(io, sellerId, {
        type: 'order_placed',
        title: 'Pesanan Baru',
        message: `Pesanan baru dari ${order.first_name} ${order.last_name}`,
        data: { orderId, status },
        referenceId: orderId,
        referenceType: 'order',
      });
    } catch (error) {
      logger.error('Error notifying order update:', error);
    }
  }
}

export default ChatWebSocketHandler;
