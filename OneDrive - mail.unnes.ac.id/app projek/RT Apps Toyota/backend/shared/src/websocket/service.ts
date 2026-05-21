/**
 * WebSocket Service
 * Handles real-time communication between clients and services
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';
import {
  WebSocketMessage,
  WebSocketEventType,
  WebSocketClient,
  WebSocketRoom,
} from './types';
import { verifyToken } from '../utils/jwt';

export class WebSocketService {
  private io: SocketIOServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private rooms: Map<string, WebSocketRoom> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private maxQueueSize = 1000;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6, // 1MB
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.initializeDefaultRooms();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.roles?.[0] || 'resident';
        socket.data.permissions = [];

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      const clientId = socket.id;

      logger.info(`Client connected: ${clientId} (User: ${userId})`);

      // Register client
      const client: WebSocketClient = {
        id: clientId,
        userId,
        socketId: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: new Set(),
        isAuthenticated: true,
      };
      this.clients.set(clientId, client);

      // Join user-specific room
      socket.join(`user:${userId}`);
      client.rooms.add(`user:${userId}`);

      // Handle events
      socket.on('join-room', (roomName: string) =>
        this.handleJoinRoom(socket, roomName)
      );
      socket.on('leave-room', (roomName: string) =>
        this.handleLeaveRoom(socket, roomName)
      );
      socket.on('message', (data: any) =>
        this.handleMessage(socket, data)
      );
      socket.on('disconnect', () =>
        this.handleDisconnect(socket, clientId)
      );
      socket.on('error', (error: any) =>
        this.handleError(socket, error)
      );

      // Emit connection success
      socket.emit('connected', {
        clientId,
        userId,
        timestamp: new Date(),
      });
    });
  }

  /**
   * Initialize default rooms
   */
  private initializeDefaultRooms(): void {
    const defaultRooms = [
      {
        name: 'sos-alerts',
        description: 'SOS Alert Broadcasting',
        type: 'broadcast' as const,
      },
      {
        name: 'patrol-updates',
        description: 'Patrol Location & Incident Updates',
        type: 'broadcast' as const,
      },
      {
        name: 'marketplace-orders',
        description: 'Marketplace Order Updates',
        type: 'broadcast' as const,
      },
      {
        name: 'waste-bank-deposits',
        description: 'Waste Bank Deposit Notifications',
        type: 'broadcast' as const,
      },
      {
        name: 'system-notifications',
        description: 'System-wide Notifications',
        type: 'broadcast' as const,
      },
    ];

    defaultRooms.forEach((room) => {
      this.rooms.set(room.name, {
        name: room.name,
        description: room.description,
        members: new Set(),
        createdAt: new Date(),
        type: room.type,
      });
    });

    logger.info(`Initialized ${defaultRooms.length} default rooms`);
  }

  /**
   * Handle join room request
   */
  private handleJoinRoom(socket: Socket, roomName: string): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (!client) {
      socket.emit('error', {
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found',
      });
      return;
    }

    const room = this.rooms.get(roomName);
    if (!room) {
      socket.emit('error', {
        code: 'ROOM_NOT_FOUND',
        message: `Room ${roomName} not found`,
      });
      return;
    }

    // Check permissions for private rooms
    if (room.type === 'private') {
      // Add permission check logic here
    }

    socket.join(roomName);
    client.rooms.add(roomName);
    room.members.add(clientId);

    logger.info(
      `Client ${clientId} joined room ${roomName}`
    );

    // Notify room members
    this.io.to(roomName).emit('user-joined', {
      clientId,
      userId: client.userId,
      roomName,
      timestamp: new Date(),
    });
  }

  /**
   * Handle leave room request
   */
  private handleLeaveRoom(socket: Socket, roomName: string): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (!client) return;

    socket.leave(roomName);
    client.rooms.delete(roomName);

    const room = this.rooms.get(roomName);
    if (room) {
      room.members.delete(clientId);
    }

    logger.info(
      `Client ${clientId} left room ${roomName}`
    );

    // Notify room members
    this.io.to(roomName).emit('user-left', {
      clientId,
      userId: client.userId,
      roomName,
      timestamp: new Date(),
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(socket: Socket, data: any): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (!client) return;

    client.lastActivity = new Date();

    const message: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: data.type || WebSocketEventType.SYSTEM_ALERT,
      timestamp: new Date(),
      userId: client.userId,
      data: data.payload,
      metadata: data.metadata,
    };

    this.enqueueMessage(message);
    logger.debug(`Message received from ${clientId}`, message);
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(_socket: Socket, clientId: string): void {
    const client = this.clients.get(clientId);

    if (client) {
      // Remove from all rooms
      client.rooms.forEach((roomName) => {
        const room = this.rooms.get(roomName);
        if (room) {
          room.members.delete(clientId);
        }
      });

      this.clients.delete(clientId);
      logger.info(
        `Client disconnected: ${clientId} (User: ${client.userId})`
      );
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(socket: Socket, error: any): void {
    logger.error(`WebSocket error from ${socket.id}`, error);
    socket.emit('error', {
      code: 'WEBSOCKET_ERROR',
      message: error.message || 'An error occurred',
    });
  }

  /**
   * Enqueue message for processing
   */
  private enqueueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  /**
   * Get server instance
   */
  public getServer(): SocketIOServer {
    return this.io;
  }

  /**
   * Get connected clients count
   */
  public getClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get room members count
   */
  public getRoomMembersCount(roomName: string): number {
    const room = this.rooms.get(roomName);
    return room ? room.members.size : 0;
  }
}

export default WebSocketService;
