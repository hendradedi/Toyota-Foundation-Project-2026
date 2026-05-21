/**
 * Analytics Service
 * Collects and analyzes real-time data from WebSocket events
 */

import { getPool } from '../database';
import logger from '../utils/logger';
import {
  DashboardStats,
  AlertStats,
  OrderStats,
  DepositStats,
  PatrolStats,
  DashboardMetrics,
  RealTimeEvent,
} from './types';

export class AnalyticsService {
  private eventBuffer: RealTimeEvent[] = [];
  private maxBufferSize = 1000;
  private flushInterval = 60000; // 1 minute

  constructor() {
    // Periodically flush event buffer
    setInterval(() => this.flushEventBuffer(), this.flushInterval);
  }

  /**
   * Add event to buffer for processing
   */
  addEvent(event: RealTimeEvent): void {
    this.eventBuffer.push(event);
    
    // Keep buffer size manageable
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }
  }

  /**
   * Flush event buffer to database
   */
  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      const pool = getPool();
      
      for (const event of events) {
        await pool.query(
          `INSERT INTO analytics_events (type, data, source, priority, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [event.type, JSON.stringify(event.data), event.source, event.priority]
        );
      }

      logger.debug(`Flushed ${events.length} events to analytics database`);
    } catch (error) {
      logger.error('Failed to flush event buffer', error);
      // Re-add events to buffer on failure
      this.eventBuffer = [...events, ...this.eventBuffer].slice(0, this.maxBufferSize);
    }
  }

  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const pool = getPool();

    try {
      // Get alert stats
      const alertStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('pending', 'acknowledged', 'in_progress')) as active,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved
        FROM emergency_alerts
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // Get order stats
      const orderStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed', 'preparing')) as active,
          COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // Get deposit stats
      const depositStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(points_earned), 0) as points
        FROM waste_deposits
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // Get patrol stats
      const patrolStats = await pool.query(`
        SELECT COUNT(DISTINCT patrol_id) as active
        FROM patrol_shifts
        WHERE start_time <= NOW() 
        AND (end_time IS NULL OR end_time >= NOW())
      `);

      // Get resident count
      const residentStats = await pool.query(`
        SELECT COUNT(*) as total
        FROM users
        WHERE status = 'active'
      `);

      return {
        totalAlerts: parseInt(alertStats.rows[0]?.total || '0'),
        activeAlerts: parseInt(alertStats.rows[0]?.active || '0'),
        resolvedAlerts: parseInt(alertStats.rows[0]?.resolved || '0'),
        totalOrders: parseInt(orderStats.rows[0]?.total || '0'),
        activeOrders: parseInt(orderStats.rows[0]?.active || '0'),
        completedOrders: parseInt(orderStats.rows[0]?.completed || '0'),
        totalDeposits: parseInt(depositStats.rows[0]?.total || '0'),
        totalPoints: parseFloat(depositStats.rows[0]?.points || '0'),
        activePatrols: parseInt(patrolStats.rows[0]?.active || '0'),
        totalResidents: parseInt(residentStats.rows[0]?.total || '0'),
      };
    } catch (error) {
      logger.error('Failed to get dashboard stats', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<AlertStats> {
    const pool = getPool();

    try {
      // By type
      const byType = await pool.query(`
        SELECT alert_type, COUNT(*) as count
        FROM emergency_alerts
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY alert_type
      `);

      // By status
      const byStatus = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM emergency_alerts
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY status
      `);

      // By neighborhood
      const byNeighborhood = await pool.query(`
        SELECT u.neighborhood_id, COUNT(*) as count
        FROM emergency_alerts e
        JOIN users u ON e.user_id = u.id
        WHERE e.created_at >= NOW() - INTERVAL '30 days'
        AND u.neighborhood_id IS NOT NULL
        GROUP BY u.neighborhood_id
      `);

      // Recent alerts
      const recentAlerts = await pool.query(`
        SELECT 
          e.id, e.alert_number, e.alert_type, e.status,
          e.latitude, e.longitude, e.address, e.created_at,
          u.neighborhood_id
        FROM emergency_alerts e
        JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
        LIMIT 10
      `);

      return {
        byType: Object.fromEntries(byType.rows.map(r => [r.alert_type, parseInt(r.count)])),
        byStatus: Object.fromEntries(byStatus.rows.map(r => [r.status, parseInt(r.count)])),
        byNeighborhood: Object.fromEntries(byNeighborhood.rows.map(r => [r.neighborhood_id, parseInt(r.count)])),
        recentAlerts: recentAlerts.rows.map(r => ({
          id: r.id,
          alertNumber: r.alert_number,
          type: r.alert_type,
          status: r.status,
          location: {
            latitude: r.latitude,
            longitude: r.longitude,
            address: r.address,
          },
          createdAt: r.created_at,
          neighborhoodId: r.neighborhood_id,
        })),
      };
    } catch (error) {
      logger.error('Failed to get alert stats', error);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<OrderStats> {
    const pool = getPool();

    try {
      // By status
      const byStatus = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY status
      `);

      // By business
      const byBusiness = await pool.query(`
        SELECT b.id, b.name, COUNT(o.id) as count
        FROM orders o
        JOIN businesses b ON o.business_id = b.id
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY b.id, b.name
        ORDER BY count DESC
        LIMIT 10
      `);

      // Revenue
      const revenue = await pool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '30 days'
      `);

      // Recent orders
      const recentOrders = await pool.query(`
        SELECT 
          o.id, o.order_number, o.status, o.total_amount,
          u.full_name as customer_name,
          b.name as business_name,
          o.created_at
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN businesses b ON o.business_id = b.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `);

      return {
        byStatus: Object.fromEntries(byStatus.rows.map(r => [r.status, parseInt(r.count)])),
        byBusiness: Object.fromEntries(byBusiness.rows.map(r => [r.name, parseInt(r.count)])),
        recentOrders: recentOrders.rows.map(r => ({
          id: r.id,
          orderNumber: r.order_number,
          status: r.status,
          totalAmount: parseFloat(r.total_amount),
          customerName: r.customer_name,
          businessName: r.business_name,
          createdAt: r.created_at,
        })),
        revenue: parseFloat(revenue.rows[0]?.total || '0'),
      };
    } catch (error) {
      logger.error('Failed to get order stats', error);
      throw error;
    }
  }

  /**
   * Get deposit statistics
   */
  async getDepositStats(): Promise<DepositStats> {
    const pool = getPool();

    try {
      // By category
      const byCategory = await pool.query(`
        SELECT wc.name, COUNT(wd.id) as count, SUM(wd.weight) as total_weight
        FROM waste_deposits wd
        JOIN waste_categories wc ON wd.category_id = wc.id
        WHERE wd.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY wc.name
      `);

      // Total weight
      const totalWeight = await pool.query(`
        SELECT COALESCE(SUM(weight), 0) as total
        FROM waste_deposits
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // Recent deposits
      const recentDeposits = await pool.query(`
        SELECT 
          wd.id, wd.user_id, wd.weight, wd.points_earned, wd.status,
          u.full_name as user_name,
          wc.name as category_name,
          wd.created_at
        FROM waste_deposits wd
        JOIN users u ON wd.user_id = u.id
        JOIN waste_categories wc ON wd.category_id = wc.id
        ORDER BY wd.created_at DESC
        LIMIT 10
      `);

      // Points by user
      const pointsByUser = await pool.query(`
        SELECT user_id, SUM(points_earned) as total_points
        FROM waste_deposits
        WHERE status = 'approved'
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY user_id
        ORDER BY total_points DESC
        LIMIT 10
      `);

      return {
        byCategory: Object.fromEntries(byCategory.rows.map(r => [r.name, parseFloat(r.total_weight)])),
        byWeight: parseFloat(totalWeight.rows[0]?.total || '0'),
        recentDeposits: recentDeposits.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          categoryId: r.category_id,
          categoryName: r.category_name,
          weight: parseFloat(r.weight),
          points: parseFloat(r.points_earned),
          status: r.status,
          createdAt: r.created_at,
        })),
        pointsByUser: Object.fromEntries(pointsByUser.rows.map(r => [r.user_id, parseFloat(r.total_points)])),
      };
    } catch (error) {
      logger.error('Failed to get deposit stats', error);
      throw error;
    }
  }

  /**
   * Get patrol statistics
   */
  async getPatrolStats(): Promise<PatrolStats> {
    const pool = getPool();

    try {
      // Active shifts
      const activeShifts = await pool.query(`
        SELECT COUNT(DISTINCT patrol_id) as count
        FROM patrol_shifts
        WHERE start_time <= NOW()
        AND (end_time IS NULL OR end_time >= NOW())
      `);

      // Patrols by location (approximate by latitude/longitude grouping)
      const patrolsByLocation = await pool.query(`
        SELECT 
          ROUND(latitude, 2) as lat_group,
          ROUND(longitude, 2) as lng_group,
          COUNT(*) as count
        FROM patrol_locations
        WHERE recorded_at >= NOW() - INTERVAL '1 hour'
        GROUP BY lat_group, lng_group
      `);

      // Recent incidents
      const recentIncidents = await pool.query(`
        SELECT 
          pi.id, pi.patrol_id, pi.type, pi.description, pi.status,
          pi.latitude, pi.longitude, pi.reported_at,
          u.full_name as patrol_name
        FROM patrol_incidents pi
        JOIN patrol_shifts ps ON pi.shift_id = ps.id
        JOIN users u ON ps.patrol_id = u.id
        ORDER BY pi.reported_at DESC
        LIMIT 10
      `);

      // Shift schedule
      const shiftSchedule = await pool.query(`
        SELECT 
          ps.id as shift_id, ps.patrol_id, ps.start_time, ps.end_time, ps.route,
          u.full_name as patrol_name,
          CASE
            WHEN ps.start_time <= NOW() AND (ps.end_time IS NULL OR ps.end_time >= NOW()) THEN 'active'
            WHEN ps.end_time < NOW() THEN 'completed'
            ELSE 'scheduled'
          END as status
        FROM patrol_shifts ps
        JOIN users u ON ps.patrol_id = u.id
        WHERE ps.start_time >= NOW() - INTERVAL '24 hours'
        OR (ps.start_time <= NOW() AND (ps.end_time IS NULL OR ps.end_time >= NOW()))
        ORDER BY ps.start_time DESC
        LIMIT 20
      `);

      return {
        activeShifts: parseInt(activeShifts.rows[0]?.count || '0'),
        patrolsByLocation: Object.fromEntries(
          patrolsByLocation.rows.map(r => [`${r.lat_group},${r.lng_group}`, parseInt(r.count)])
        ),
        recentIncidents: recentIncidents.rows.map(r => ({
          id: r.id,
          patrolId: r.patrol_id,
          patrolName: r.patrol_name,
          type: r.type,
          description: r.description,
          location: {
            latitude: r.latitude,
            longitude: r.longitude,
          },
          reportedAt: r.reported_at,
          status: r.status,
        })),
        shiftSchedule: shiftSchedule.rows.map(r => ({
          shiftId: r.shift_id,
          patrolId: r.patrol_id,
          patrolName: r.patrol_name,
          startTime: r.start_time,
          endTime: r.end_time,
          status: r.status,
          route: r.route,
        })),
      };
    } catch (error) {
      logger.error('Failed to get patrol stats', error);
      throw error;
    }
  }

  /**
   * Get complete dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [overall, alerts, orders, deposits, patrols] = await Promise.all([
      this.getDashboardStats(),
      this.getAlertStats(),
      this.getOrderStats(),
      this.getDepositStats(),
      this.getPatrolStats(),
    ]);

    return {
      overall,
      alerts,
      orders,
      deposits,
      patrols,
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
