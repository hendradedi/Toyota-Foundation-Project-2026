# WebSocket Implementation Guide

## Overview

The RT Apps Toyota system now includes real-time communication capabilities using WebSocket (Socket.IO). This enables instant updates for SOS alerts, patrol tracking, marketplace orders, and waste bank deposits.

## Architecture

### Components

1. **WebSocket Server** (`backend/shared/src/websocket/service.ts`)
   - Runs on the API Gateway
   - Handles client connections and authentication
   - Manages rooms and broadcasting

2. **WebSocket Client** (`backend/shared/src/websocket/client.ts`)
   - Used by microservices to emit events
   - Handles reconnection automatically
   - Provides type-safe event emission

3. **WebSocket Types** (`backend/shared/src/websocket/types.ts`)
   - Defines all event types
   - Provides TypeScript interfaces for payloads

## Event Types

### SOS Events
- `SOS_ALERT_CREATED` - New emergency alert
- `SOS_ALERT_UPDATED` - Alert status changed
- `SOS_ALERT_RESOLVED` - Alert resolved

### Patrol Events
- `PATROL_SHIFT_STARTED` - Patrol shift begins
- `PATROL_SHIFT_ENDED` - Patrol shift ends
- `PATROL_LOCATION_UPDATED` - Patrol location update
- `PATROL_INCIDENT_REPORTED` - New incident reported

### Marketplace Events
- `ORDER_CREATED` - New order placed
- `ORDER_UPDATED` - Order status changed
- `ORDER_COMPLETED` - Order fulfilled
- `ORDER_CANCELLED` - Order cancelled

### Waste Bank Events
- `DEPOSIT_RECORDED` - New waste deposit
- `DEPOSIT_APPROVED` - Deposit approved
- `DEPOSIT_REJECTED` - Deposit rejected
- `POINTS_AWARDED` - Points credited

### System Events
- `SYSTEM_ALERT` - System-wide notification
- `USER_NOTIFICATION` - User-specific notification

## Default Rooms

The WebSocket server creates these rooms automatically:

- `sos-alerts` - SOS alert broadcasting
- `patrol-updates` - Patrol location & incident updates
- `marketplace-orders` - Marketplace order updates
- `waste-bank-deposits` - Waste bank deposit notifications
- `system-notifications` - System-wide notifications

## Client Connection

### Authentication

Clients must provide a JWT token when connecting:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Connection Events

```javascript
// Connection successful
socket.on('connected', (data) => {
  console.log('Connected:', data.clientId, data.userId);
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Joining Rooms

```javascript
// Join a room
socket.emit('join-room', 'sos-alerts');

// User joined confirmation
socket.on('user-joined', (data) => {
  console.log('Joined room:', data.roomName);
});

// Leave a room
socket.emit('leave-room', 'sos-alerts');
```

## Receiving Events

```javascript
// Listen for SOS alerts
socket.on('message', (message) => {
  if (message.type === 'sos:alert:created') {
    console.log('New SOS Alert:', message.data);
    // Handle alert
  }
});
```

## Service Integration

### Emitting Events from Services

Services use the WebSocket client to emit events:

```typescript
import { createWebSocketClient } from '@rt-muban/shared/src/websocket/client';
import { WebSocketEventType } from '@rt-muban/shared/src/websocket/types';

// Initialize client (once per service)
const wsClient = createWebSocketClient(serviceToken);

// Emit an event
wsClient.emit(
  WebSocketEventType.SOS_ALERT_CREATED,
  {
    id: alert.id,
    type: alert.type,
    location: alert.location,
    userId: alert.userId,
  },
  {
    source: 'sos-service',
    priority: 'critical',
    retryable: true,
  }
);

// Broadcast to specific room
wsClient.broadcastToRoom(
  'sos-alerts',
  WebSocketEventType.SOS_ALERT_CREATED,
  alertData,
  { source: 'sos-service', priority: 'critical' }
);
```

## Frontend Integration Examples

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = io('http://localhost:3000', {
      auth: { token }
    });

    ws.on('connect', () => setConnected(true));
    ws.on('disconnect', () => setConnected(false));

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [token]);

  return { socket, connected };
}
```

### React Component

```typescript
function SOSAlerts() {
  const { socket, connected } = useWebSocket(authToken);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Join SOS alerts room
    socket.emit('join-room', 'sos-alerts');

    // Listen for new alerts
    socket.on('message', (message) => {
      if (message.type === 'sos:alert:created') {
        setAlerts(prev => [message.data, ...prev]);
        // Show notification
        showNotification('New SOS Alert!', message.data);
      }
    });

    return () => {
      socket.emit('leave-room', 'sos-alerts');
    };
  }, [socket]);

  return (
    <div>
      <h2>SOS Alerts {connected ? '🟢' : '🔴'}</h2>
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

## Environment Variables

Add to `.env`:

```env
# WebSocket Configuration
WEBSOCKET_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

## Testing WebSocket

### Using Socket.IO Client (Node.js)

```javascript
const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
  
  // Join room
  socket.emit('join-room', 'sos-alerts');
  
  // Listen for messages
  socket.on('message', (msg) => {
    console.log('Received:', msg);
  });
});
```

### Using Browser Console

```javascript
// Load Socket.IO client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
document.head.appendChild(script);

// After script loads
const socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => console.log('Connected'));
socket.on('message', (msg) => console.log('Message:', msg));
socket.emit('join-room', 'sos-alerts');
```

## Security Considerations

1. **Authentication Required**: All connections must provide valid JWT token
2. **Room Permissions**: Private rooms check user permissions before joining
3. **Rate Limiting**: Connection attempts are rate-limited
4. **Message Validation**: All messages are validated before broadcasting
5. **CORS Configuration**: Only allowed origins can connect

## Performance

- **Ping Interval**: 25 seconds
- **Ping Timeout**: 60 seconds
- **Max Buffer Size**: 1MB per message
- **Transports**: WebSocket (preferred), Polling (fallback)
- **Reconnection**: Automatic with exponential backoff

## Monitoring

The WebSocket service logs:
- Client connections/disconnections
- Room joins/leaves
- Message broadcasts
- Errors and warnings

Check logs at: `backend/logs/combined.log`

## Next Steps

1. **Add Event Emitters**: Update each microservice to emit WebSocket events
2. **Frontend Integration**: Add WebSocket hooks to React components
3. **Mobile Support**: Integrate Socket.IO client in React Native app
4. **Analytics**: Track real-time user engagement
5. **Load Testing**: Test with multiple concurrent connections

## Troubleshooting

### Connection Fails
- Check JWT token is valid
- Verify CORS settings
- Ensure API Gateway is running
- Check firewall/network settings

### Messages Not Received
- Verify client joined correct room
- Check event type matches
- Ensure WebSocket service is initialized
- Review server logs for errors

### High Latency
- Check network conditions
- Monitor server CPU/memory
- Consider Redis adapter for scaling
- Review message payload sizes

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Review code: `backend/shared/src/websocket/`
- Contact: Development Team
