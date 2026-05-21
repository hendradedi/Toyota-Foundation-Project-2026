/**
 * WebSocket Types & Interfaces
 * Defines all WebSocket event types and message structures
 */

export enum WebSocketEventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',

  // SOS Events
  SOS_ALERT_CREATED = 'sos:alert:created',
  SOS_ALERT_UPDATED = 'sos:alert:updated',
  SOS_ALERT_RESOLVED = 'sos:alert:resolved',
  SOS_RESPONDER_ASSIGNED = 'sos:responder:assigned',

  // Patrol Events
  PATROL_SHIFT_STARTED = 'patrol:shift:started',
  PATROL_SHIFT_ENDED = 'patrol:shift:ended',
  PATROL_INCIDENT_REPORTED = 'patrol:incident:reported',
  PATROL_LOCATION_UPDATE = 'patrol:location:update',

  // Marketplace Events
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  ORDER_COMPLETED = 'order:completed',
  PRODUCT_STOCK_CHANGED = 'product:stock:changed',

  // Waste Bank Events
  DEPOSIT_RECORDED = 'deposit:recorded',
  POINTS_EARNED = 'points:earned',
  COLLECTION_SCHEDULED = 'collection:scheduled',

  // Notification Events
  NOTIFICATION_SENT = 'notification:sent',
  NOTIFICATION_READ = 'notification:read',

  // System Events
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_MAINTENANCE = 'system:maintenance',
}

export interface WebSocketMessage<T = any> {
  id: string;
  type: WebSocketEventType;
  timestamp: Date;
  userId?: string;
  data: T;
  metadata?: {
    source: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    retryable?: boolean;
  };
}

export interface WebSocketClient {
  id: string;
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: Set<string>;
  isAuthenticated: boolean;
}

export interface WebSocketRoom {
  name: string;
  description: string;
  members: Set<string>;
  createdAt: Date;
  type: 'public' | 'private' | 'broadcast';
}

// SOS Event Payloads
export interface SOSAlertPayload {
  alertId: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  alertType: 'medical' | 'security' | 'fire' | 'other';
  description: string;
  status: 'active' | 'assigned' | 'resolved';
  responders?: string[];
}

// Patrol Event Payloads
export interface PatrolLocationUpdatePayload {
  patrolId: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: Date;
}

export interface PatrolIncidentPayload {
  incidentId: string;
  patrolId: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  incidentType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Marketplace Event Payloads
export interface OrderUpdatePayload {
  orderId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  buyerId: string;
  sellerId: string;
  totalAmount: number;
  updatedAt: Date;
}

// Waste Bank Event Payloads
export interface DepositRecordedPayload {
  depositId: string;
  userId: string;
  wasteCategory: string;
  weight: number;
  points: number;
  timestamp: Date;
}

// Notification Event Payloads
export interface NotificationPayload {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface WebSocketError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
