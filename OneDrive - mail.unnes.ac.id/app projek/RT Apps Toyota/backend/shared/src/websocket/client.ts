/**
 * WebSocket Client Helper
 * Provides utilities for services to emit WebSocket events
 */

import { io, Socket } from 'socket.io-client';
import logger from '../utils/logger';
import { WebSocketMessage, WebSocketEventType } from './types';

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private serviceToken: string) {}

  /**
   * Connect to WebSocket server
   */
  connect(url?: string): void {
    const wsUrl = url || process.env.WEBSOCKET_URL || 'http://localhost:3000';

    this.socket = io(wsUrl, {
      auth: {
        token: this.serviceToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('WebSocket client connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      logger.warn(`WebSocket client disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error: Error) => {
      logger.error('WebSocket connection error', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached');
        this.socket?.close();
      }
    });

    this.socket.on('error', (error: Error) => {
      logger.error('WebSocket error', error);
    });
  }

  /**
   * Emit an event to the WebSocket server
   */
  emit<T = any>(
    eventType: WebSocketEventType,
    data: T,
    metadata?: {
      source: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      retryable?: boolean;
    }
  ): void {
    if (!this.socket || !this.socket.connected) {
      logger.warn('WebSocket not connected, event not sent', { eventType, data });
      return;
    }

    const message: WebSocketMessage<T> = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: eventType,
      timestamp: new Date(),
      data,
      metadata,
    };

    this.socket.emit('message', message);
    logger.debug('WebSocket event emitted', { eventType, messageId: message.id });
  }

  /**
   * Broadcast to a specific room
   */
  broadcastToRoom<T = any>(
    room: string,
    eventType: WebSocketEventType,
    data: T,
    metadata?: {
      source: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      retryable?: boolean;
    }
  ): void {
    if (!this.socket || !this.socket.connected) {
      logger.warn('WebSocket not connected, broadcast not sent', { room, eventType });
      return;
    }

    const message: WebSocketMessage<T> = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: eventType,
      timestamp: new Date(),
      data,
      metadata,
    };

    this.socket.emit('broadcast-to-room', { room, message });
    logger.debug('WebSocket broadcast sent', { room, eventType, messageId: message.id });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      logger.info('WebSocket client disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

/**
 * Create a WebSocket client instance for a service
 */
export function createWebSocketClient(serviceToken: string): WebSocketClient {
  const client = new WebSocketClient(serviceToken);
  client.connect();
  return client;
}
