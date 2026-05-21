# Phase 3.2: Cross-Module Workflows Integration

## Overview

This document describes the integration of WebSocket real-time events across all microservices in the RT Apps Toyota system. Each service now emits WebSocket events for critical operations, enabling real-time updates across the application.

## Completed Integrations

### 1. SOS Service Integration

**File**: [`backend/services/sos-service/src/controllers/sos.controller.ts`](backend/services/sos-service/src/controllers/sos.controller.ts)

**Events Emitted**:
- `SOS_ALERT_CREATED` - When a new emergency alert is created
- `SOS_ALERT_UPDATED` - When alert status changes (to be implemented)
- `SOS_ALERT_RESOLVED` - When alert is resolved (to be implemented)

**Implementation**:
```typescript
// Import WebSocket client
import { createWebSocketClient, WebSocketEventType } from '@rt-muban/shared';

// Initialize WebSocket client
const wsClient = createWebSocketClient('sos-service-token');

// Emit event when alert is created
wsClient.broadcastToRoom(
  'sos-alerts',
  WebSocketEventType.SOS_ALERT_CREATED,
  {
    id: alert.id,
    alertNumber: alert.alert_number,
    type: alert.alert_type,
    description: alert.description,
    location: {
      latitude: alert.latitude,
      longitude: alert.longitude,
      address: alert.address,
    },
    status: alert.status,
    userId: alert.user_id,
    neighborhoodId,
    createdAt: alert.created_at,
  },
  {
    source: 'sos-service',
    priority: 'critical',
    retryable: true,
  }
);
```

## Integration Guide for Other Services

### 2. Patrol Service Integration

**File**: `backend/services/patrol-service/src/controllers/patrol.controller.ts`

**Events to Emit**:
- `PATROL_SHIFT_STARTED` - When patrol shift begins
- `PATROL_SHIFT_ENDED` - When patrol shift ends
- `PATROL_LOCATION_UPDATED` - When patrol location is updated
- `PATROL_INCIDENT_REPORTED` - When incident is reported

**Implementation Example**:
```typescript
// Add to patrol.controller.ts
import { createWebSocketClient, WebSocketEventType } from '@rt-muban/shared';

const wsClient = createWebSocketClient('patrol-service-token');

// In startShift function
wsClient.broadcastToRoom(
  'patrol-updates',
  WebSocketEventType.PATROL_SHIFT_STARTED,
  {
    shiftId: shift.id,
    patrolId: shift.patrol_id,
    startTime: shift.start_time,
    route: shift.route,
    status: shift.status,
  },
  {
    source: 'patrol-service',
    priority: 'medium',
  }
);

// In updateLocation function
wsClient.broadcastToRoom(
  'patrol-updates',
  WebSocketEventType.PATROL_LOCATION_UPDATED,
  {
    patrolId: patrol.id,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    timestamp: new Date(),
  },
  {
    source: 'patrol-service',
    priority: 'low',
  }
);
```

### 3. Marketplace Service Integration

**File**: `backend/services/marketplace-service/src/controllers/order.controller.ts`

**Events to Emit**:
- `ORDER_CREATED` - When new order is placed
- `ORDER_UPDATED` - When order status changes
- `ORDER_COMPLETED` - When order is fulfilled
- `ORDER_CANCELLED` - When order is cancelled

**Implementation Example**:
```typescript
// Add to order.controller.ts
import { createWebSocketClient, WebSocketEventType } from '@rt-muban/shared';

const wsClient = createWebSocketClient('marketplace-service-token');

// In createOrder function
wsClient.broadcastToRoom(
  'marketplace-orders',
  WebSocketEventType.ORDER_CREATED,
  {
    orderId: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    businessId: order.business_id,
    items: order.items,
    totalAmount: order.total_amount,
    status: order.status,
    createdAt: order.created_at,
  },
  {
    source: 'marketplace-service',
    priority: 'medium',
  }
);

// In updateOrderStatus function
wsClient.emit(
  WebSocketEventType.ORDER_UPDATED,
  {
    orderId: order.id,
    status: newStatus,
    updatedAt: new Date(),
  },
  {
    source: 'marketplace-service',
    priority: 'medium',
  }
);
```

### 4. Waste Bank Service Integration

**File**: `backend/services/waste-bank-service/src/controllers/points.controller.ts`

**Events to Emit**:
- `DEPOSIT_RECORDED` - When waste deposit is recorded
- `DEPOSIT_APPROVED` - When deposit is approved
- `DEPOSIT_REJECTED` - When deposit is rejected
- `POINTS_AWARDED` - When points are credited

**Implementation Example**:
```typescript
// Add to points.controller.ts
import { createWebSocketClient, WebSocketEventType } from '@rt-muban/shared';

const wsClient = createWebSocketClient('waste-bank-service-token');

// In recordDeposit function
wsClient.broadcastToRoom(
  'waste-bank-deposits',
  WebSocketEventType.DEPOSIT_RECORDED,
  {
    depositId: deposit.id,
    userId: deposit.user_id,
    categoryId: deposit.category_id,
    weight: deposit.weight,
    points: deposit.points_earned,
    status: deposit.status,
    createdAt: deposit.created_at,
  },
  {
    source: 'waste-bank-service',
    priority: 'low',
  }
);

// In approveDeposit function
wsClient.emit(
  WebSocketEventType.POINTS_AWARDED,
  {
    userId: deposit.user_id,
    points: deposit.points_earned,
    depositId: deposit.id,
    newBalance: userBalance,
  },
  {
    source: 'waste-bank-service',
    priority: 'medium',
  }
);
```

## Cross-Module Workflow Examples

### Workflow 1: Emergency Response Chain

1. **SOS Alert Created** → Broadcasts to `sos-alerts` room
2. **Patrol Service** listens and assigns nearest patrol
3. **Patrol Location Updated** → Broadcasts patrol approaching
4. **SOS Alert Resolved** → Notifies all subscribers

```typescript
// Frontend listening for the workflow
socket.on('message', (message) => {
  switch (message.type) {
    case 'sos:alert:created':
      showEmergencyAlert(message.data);
      break;
    case 'patrol:location:updated':
      updatePatrolMarker(message.data);
      break;
    case 'sos:alert:resolved':
      hideEmergencyAlert(message.data.id);
      break;
  }
});
```

### Workflow 2: Marketplace Order Fulfillment

1. **Order Created** → Notifies business owner
2. **Order Updated** (preparing) → Notifies customer
3. **Patrol Assigned** for delivery → Updates order status
4. **Order Completed** → Credits points to customer

### Workflow 3: Waste Bank Gamification

1. **Deposit Recorded** → Shows pending deposit
2. **Deposit Approved** → Awards points
3. **Points Awarded** → Updates leaderboard
4. **Achievement Unlocked** → Sends notification

## Testing Cross-Module Workflows

### Test Script Example

```javascript
const { io } = require('socket.io-client');

// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

// Join all rooms
socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join-room', 'sos-alerts');
  socket.emit('join-room', 'patrol-updates');
  socket.emit('join-room', 'marketplace-orders');
  socket.emit('join-room', 'waste-bank-deposits');
});

// Listen for all events
socket.on('message', (msg) => {
  console.log(`[${msg.type}]`, msg.data);
  console.log(`Priority: ${msg.metadata?.priority}`);
  console.log(`Source: ${msg.metadata?.source}`);
  console.log('---');
});

// Test creating SOS alert
async function testSOSWorkflow() {
  const response = await fetch('http://localhost:3001/api/sos/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: 'user-123',
      alert_type: 'medical',
      description: 'Test emergency',
      location: {
        latitude: -6.2088,
        longitude: 106.8456,
        address: 'Test Location'
      }
    })
  });
  
  // Should receive WebSocket event immediately
}
```

## Environment Configuration

Add to each service's `.env`:

```env
# WebSocket Configuration
WEBSOCKET_URL=http://localhost:3000
SERVICE_TOKEN=your-service-specific-token
```

## Monitoring and Debugging

### Check WebSocket Connections

```bash
# View active connections
curl http://localhost:3000/api/health

# Check logs
tail -f backend/logs/combined.log | grep WebSocket
```

### Debug Event Flow

```typescript
// Add to any controller
logger.debug('WebSocket event emitted', {
  type: WebSocketEventType.SOS_ALERT_CREATED,
  room: 'sos-alerts',
  data: alertData
});
```

## Performance Considerations

1. **Event Batching**: Group multiple events when possible
2. **Selective Broadcasting**: Only broadcast to relevant rooms
3. **Payload Size**: Keep event payloads under 10KB
4. **Priority Levels**: Use appropriate priority for each event type
5. **Retry Logic**: Enable retryable flag for critical events

## Security

1. **Authentication**: All WebSocket connections require valid JWT
2. **Room Access**: Verify user permissions before joining rooms
3. **Data Sanitization**: Sanitize all event payloads
4. **Rate Limiting**: Limit events per user/service
5. **Audit Logging**: Log all critical events

## Next Steps

1. **Complete Service Integrations**: Add WebSocket to remaining services
2. **Frontend Integration**: Update React components to listen for events
3. **Mobile Integration**: Add WebSocket to React Native app
4. **Analytics Dashboard**: Track real-time metrics
5. **Load Testing**: Test with 1000+ concurrent connections

## Support

For implementation help:
- Review: [`backend/WEBSOCKET_IMPLEMENTATION.md`](backend/WEBSOCKET_IMPLEMENTATION.md)
- Check: [`backend/shared/src/websocket/`](backend/shared/src/websocket/)
- Contact: Development Team
