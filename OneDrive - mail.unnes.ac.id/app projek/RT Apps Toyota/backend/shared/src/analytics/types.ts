/**
 * Analytics Types
 * Types for real-time analytics and dashboard data
 */

export interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalDeposits: number;
  totalPoints: number;
  activePatrols: number;
  totalResidents: number;
}

export interface AlertStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byNeighborhood: Record<string, number>;
  recentAlerts: AlertSummary[];
}

export interface OrderStats {
  byStatus: Record<string, number>;
  byBusiness: Record<string, number>;
  recentOrders: OrderSummary[];
  revenue: number;
}

export interface DepositStats {
  byCategory: Record<string, number>;
  byWeight: number;
  recentDeposits: DepositSummary[];
  pointsByUser: Record<string, number>;
}

export interface PatrolStats {
  activeShifts: number;
  patrolsByLocation: Record<string, number>;
  recentIncidents: IncidentSummary[];
  shiftSchedule: ShiftSchedule[];
}

export interface AlertSummary {
  id: string;
  alertNumber: string;
  type: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
  neighborhoodId?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerName: string;
  businessName: string;
  createdAt: string;
}

export interface DepositSummary {
  id: string;
  userId: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  weight: number;
  points: number;
  status: string;
  createdAt: string;
}

export interface IncidentSummary {
  id: string;
  patrolId: string;
  patrolName: string;
  type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  reportedAt: string;
  status: string;
}

export interface ShiftSchedule {
  shiftId: string;
  patrolId: string;
  patrolName: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'scheduled';
  route: string;
}

export interface RealTimeEvent {
  type: string;
  data: any;
  timestamp: string;
  source: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface DashboardMetrics {
  alerts: AlertStats;
  orders: OrderStats;
  deposits: DepositStats;
  patrols: PatrolStats;
  overall: DashboardStats;
}

export interface AnalyticsConfig {
  refreshInterval: number;
  retentionDays: number;
  aggregationWindow: 'minute' | 'hour' | 'day';
  enableRealTime: boolean;
}
