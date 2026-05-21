# Phase 3.3: Unified Dashboard & Analytics

## Overview

The Unified Dashboard provides real-time analytics and metrics across all RT Apps Toyota modules. It combines WebSocket real-time events with database analytics to deliver comprehensive insights into system operations.

## Architecture

### Components

1. **Analytics Types** ([`backend/shared/src/analytics/types.ts`](backend/shared/src/analytics/types.ts))
   - TypeScript interfaces for all analytics data
   - Dashboard statistics, alert stats, order stats, deposit stats, patrol stats
   - Real-time event types

2. **Analytics Service** ([`backend/shared/src/analytics/service.ts`](backend/shared/src/analytics/service.ts))
   - Core analytics engine
   - Data aggregation from database
   - Event buffer for real-time processing
   - Metrics calculation

3. **Analytics API** ([`backend/api-gateway/src/routes/analytics.routes.ts`](backend/api-gateway/src/routes/analytics.routes.ts))
   - REST endpoints for dashboard data
   - Real-time metrics via WebSocket
   - Authenticated access only

## API Endpoints

### GET /api/analytics/dashboard
Get complete dashboard metrics including all modules.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalAlerts": 45,
      "activeAlerts": 3,
      "resolvedAlerts": 42,
      "totalOrders": 128,
      "activeOrders": 12,
      "completedOrders": 116,
      "totalDeposits": 234,
      "totalPoints": 15680,
      "activePatrols": 5,
      "totalResidents": 1250
    },
    "alerts": {
      "byType": { "medical": 15, "fire": 8, "crime": 12, "other": 10 },
      "byStatus": { "pending": 2, "in_progress": 1, "resolved": 42 },
      "byNeighborhood": { "RT-001": 20, "RT-002": 15, "RT-003": 10 },
      "recentAlerts": [...]
    },
    "orders": {
      "byStatus": { "pending": 5, "confirmed": 4, "preparing": 3, "completed": 116 },
      "byBusiness": { "Warung Makan": 45, "Toko Kelontong": 38 },
      "recentOrders": [...],
      "revenue": 12500000
    },
    "deposits": {
      "byCategory": { "Plastic": 125.5, "Paper": 89.2, "Metal": 45.8 },
      "byWeight": 260.5,
      "recentDeposits": [...],
      "pointsByUser": { "user-123": 1250, "user-456": 980 }
    },
    "patrols": {
      "activeShifts": 5,
      "patrolsByLocation": { "-6.21,106.85": 3, "-6.22,106.86": 2 },
      "recentIncidents": [...],
      "shiftSchedule": [...]
    }
  }
}
```

### GET /api/analytics/stats
Get overall system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAlerts": 45,
    "activeAlerts": 3,
    "resolvedAlerts": 42,
    "totalOrders": 128,
    "activeOrders": 12,
    "completedOrders": 116,
    "totalDeposits": 234,
    "totalPoints": 15680,
    "activePatrols": 5,
    "totalResidents": 1250
  }
}
```

### GET /api/analytics/alerts
Get detailed alert statistics.

### GET /api/analytics/orders
Get detailed order statistics.

### GET /api/analytics/deposits
Get detailed deposit statistics.

### GET /api/analytics/patrols
Get detailed patrol statistics.

## Real-Time Updates

The dashboard receives real-time updates via WebSocket:

```typescript
import { io } from 'socket.io-client';

// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: authToken }
});

// Join analytics room
socket.emit('join-room', 'system-notifications');

// Listen for real-time events
socket.on('message', (message) => {
  switch (message.type) {
    case 'sos:alert:created':
      updateAlertCount();
      addRecentAlert(message.data);
      break;
    case 'order:created':
      updateOrderCount();
      addRecentOrder(message.data);
      break;
    case 'deposit:recorded':
      updateDepositCount();
      addRecentDeposit(message.data);
      break;
    case 'patrol:shift:started':
      updatePatrolCount();
      break;
  }
});
```

## Frontend Integration

### React Dashboard Component

```typescript
import { useEffect, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

interface DashboardMetrics {
  overall: DashboardStats;
  alerts: AlertStats;
  orders: OrderStats;
  deposits: DepositStats;
  patrols: PatrolStats;
}

export function UnifiedDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useWebSocket(authToken);

  // Fetch initial data
  useEffect(() => {
    async function fetchMetrics() {
      const response = await fetch('/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setMetrics(data.data);
      setLoading(false);
    }
    fetchMetrics();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', 'system-notifications');

    socket.on('message', (message) => {
      // Update metrics based on event type
      setMetrics(prev => {
        if (!prev) return prev;
        
        const updated = { ...prev };
        
        switch (message.type) {
          case 'sos:alert:created':
            updated.overall.totalAlerts++;
            updated.overall.activeAlerts++;
            break;
          case 'order:created':
            updated.overall.totalOrders++;
            updated.overall.activeOrders++;
            break;
          // ... handle other events
        }
        
        return updated;
      });
    });

    return () => {
      socket.emit('leave-room', 'system-notifications');
    };
  }, [socket]);

  if (loading) return <div>Loading...</div>;
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <div className="connection-status">
        {connected ? '🟢 Live' : '🔴 Offline'}
      </div>
      
      <div className="stats-grid">
        <StatCard
          title="Active Alerts"
          value={metrics.overall.activeAlerts}
          total={metrics.overall.totalAlerts}
          icon="🚨"
          color="red"
        />
        <StatCard
          title="Active Orders"
          value={metrics.overall.activeOrders}
          total={metrics.overall.totalOrders}
          icon="🛒"
          color="blue"
        />
        <StatCard
          title="Total Deposits"
          value={metrics.overall.totalDeposits}
          subtitle={`${metrics.overall.totalPoints} points`}
          icon="♻️"
          color="green"
        />
        <StatCard
          title="Active Patrols"
          value={metrics.overall.activePatrols}
          icon="👮"
          color="purple"
        />
      </div>

      <div className="charts-grid">
        <AlertsChart data={metrics.alerts} />
        <OrdersChart data={metrics.orders} />
        <DepositsChart data={metrics.deposits} />
        <PatrolsMap data={metrics.patrols} />
      </div>

      <div className="recent-activity">
        <RecentAlerts alerts={metrics.alerts.recentAlerts} />
        <RecentOrders orders={metrics.orders.recentOrders} />
        <RecentDeposits deposits={metrics.deposits.recentDeposits} />
      </div>
    </div>
  );
}
```

### Dashboard Widgets

#### 1. Alert Monitor
```typescript
function AlertMonitor({ alerts }: { alerts: AlertStats }) {
  return (
    <div className="widget alert-monitor">
      <h3>SOS Alerts</h3>
      <div className="alert-types">
        {Object.entries(alerts.byType).map(([type, count]) => (
          <div key={type} className="alert-type">
            <span>{type}</span>
            <span className="count">{count}</span>
          </div>
        ))}
      </div>
      <div className="recent-alerts">
        {alerts.recentAlerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
```

#### 2. Order Dashboard
```typescript
function OrderDashboard({ orders }: { orders: OrderStats }) {
  return (
    <div className="widget order-dashboard">
      <h3>Marketplace Orders</h3>
      <div className="revenue">
        <span>Total Revenue</span>
        <span className="amount">Rp {orders.revenue.toLocaleString()}</span>
      </div>
      <div className="order-status">
        {Object.entries(orders.byStatus).map(([status, count]) => (
          <div key={status} className="status-item">
            <span>{status}</span>
            <span className="count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3. Waste Bank Analytics
```typescript
function WasteBankAnalytics({ deposits }: { deposits: DepositStats }) {
  return (
    <div className="widget waste-analytics">
      <h3>Waste Bank</h3>
      <div className="total-weight">
        <span>Total Weight</span>
        <span className="weight">{deposits.byWeight} kg</span>
      </div>
      <div className="category-breakdown">
        {Object.entries(deposits.byCategory).map(([category, weight]) => (
          <div key={category} className="category">
            <span>{category}</span>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${(weight / deposits.byWeight) * 100}%` }}
              />
            </div>
            <span>{weight} kg</span>
          </div>
        ))}
      </div>
      <div className="leaderboard">
        <h4>Top Contributors</h4>
        {Object.entries(deposits.pointsByUser)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([userId, points]) => (
            <div key={userId} className="user-points">
              <span>{userId}</span>
              <span>{points} pts</span>
            </div>
          ))}
      </div>
    </div>
  );
}
```

#### 4. Patrol Tracker
```typescript
function PatrolTracker({ patrols }: { patrols: PatrolStats }) {
  return (
    <div className="widget patrol-tracker">
      <h3>Patrol Status</h3>
      <div className="active-patrols">
        <span>Active Patrols</span>
        <span className="count">{patrols.activeShifts}</span>
      </div>
      <div className="shift-schedule">
        {patrols.shiftSchedule.map(shift => (
          <div key={shift.shiftId} className={`shift ${shift.status}`}>
            <span>{shift.patrolName}</span>
            <span>{shift.route}</span>
            <span className="status">{shift.status}</span>
          </div>
        ))}
      </div>
      <div className="recent-incidents">
        <h4>Recent Incidents</h4>
        {patrols.recentIncidents.map(incident => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}
```

## Database Schema

Add analytics events table:

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  source VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_analytics_type (type),
  INDEX idx_analytics_created (created_at),
  INDEX idx_analytics_source (source)
);

-- Partition by month for better performance
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Performance Optimization

### 1. Caching
```typescript
import Redis from 'ioredis';

const redis = new Redis();

async function getCachedMetrics(): Promise<DashboardMetrics | null> {
  const cached = await redis.get('dashboard:metrics');
  return cached ? JSON.parse(cached) : null;
}

async function setCachedMetrics(metrics: DashboardMetrics): Promise<void> {
  await redis.setex('dashboard:metrics', 60, JSON.stringify(metrics));
}
```

### 2. Database Indexes
```sql
-- Optimize alert queries
CREATE INDEX idx_alerts_created_status ON emergency_alerts(created_at, status);
CREATE INDEX idx_alerts_neighborhood ON emergency_alerts(user_id) 
  INCLUDE (alert_type, status);

-- Optimize order queries
CREATE INDEX idx_orders_created_status ON orders(created_at, status);
CREATE INDEX idx_orders_business ON orders(business_id, created_at);

-- Optimize deposit queries
CREATE INDEX idx_deposits_created_category ON waste_deposits(created_at, category_id);
CREATE INDEX idx_deposits_user_points ON waste_deposits(user_id, points_earned) 
  WHERE status = 'approved';
```

### 3. Aggregation Views
```sql
-- Pre-aggregated daily stats
CREATE MATERIALIZED VIEW daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE type = 'alert') as total_alerts,
  COUNT(*) FILTER (WHERE type = 'order') as total_orders,
  COUNT(*) FILTER (WHERE type = 'deposit') as total_deposits
FROM analytics_events
GROUP BY DATE(created_at);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_stats;
```

## Monitoring & Alerts

### System Health Checks
```typescript
async function checkSystemHealth() {
  const metrics = await analyticsService.getDashboardStats();
  
  // Alert if too many active SOS alerts
  if (metrics.activeAlerts > 10) {
    sendAlert('HIGH_ALERT_VOLUME', metrics.activeAlerts);
  }
  
  // Alert if no active patrols
  if (metrics.activePatrols === 0) {
    sendAlert('NO_ACTIVE_PATROLS');
  }
  
  // Alert if order processing is slow
  if (metrics.activeOrders > 50) {
    sendAlert('HIGH_ORDER_BACKLOG', metrics.activeOrders);
  }
}
```

## Testing

### Unit Tests
```typescript
describe('AnalyticsService', () => {
  it('should calculate dashboard stats correctly', async () => {
    const stats = await analyticsService.getDashboardStats();
    expect(stats.totalAlerts).toBeGreaterThanOrEqual(0);
    expect(stats.activeAlerts).toBeLessThanOrEqual(stats.totalAlerts);
  });

  it('should aggregate alert stats by type', async () => {
    const alertStats = await analyticsService.getAlertStats();
    expect(alertStats.byType).toBeDefined();
    expect(Object.keys(alertStats.byType).length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
describe('Analytics API', () => {
  it('should return dashboard metrics', async () => {
    const response = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.overall).toBeDefined();
  });
});
```

## Deployment

### Environment Variables
```env
# Analytics Configuration
ANALYTICS_REFRESH_INTERVAL=60000
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_CACHE_TTL=60
REDIS_URL=redis://localhost:6379
```

### Docker Compose
```yaml
services:
  analytics:
    build: ./backend/shared
    environment:
      - ANALYTICS_REFRESH_INTERVAL=60000
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - postgres
```

## Next Steps

1. **Add More Visualizations**: Charts, graphs, heatmaps
2. **Export Functionality**: PDF reports, CSV exports
3. **Custom Dashboards**: User-configurable widgets
4. **Predictive Analytics**: ML-based forecasting
5. **Mobile Dashboard**: React Native version

## Support

For implementation help:
- Review: [`backend/shared/src/analytics/`](backend/shared/src/analytics/)
- API Docs: [`backend/api-gateway/src/routes/analytics.routes.ts`](backend/api-gateway/src/routes/analytics.routes.ts)
- Contact: Development Team
