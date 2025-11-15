# MQTT Protocol Specification

This document describes the MQTT-based real-time communication protocol used by the Rickshaw Puller App.

## Broker Configuration

### Connection Details
- **Protocol**: WebSocket (ws:// or wss://)
- **Default URL**: `ws://localhost:8083/mqtt`
- **QoS Level**: 1 (At least once delivery)
- **Clean Session**: true
- **Keepalive**: 60 seconds
- **Reconnect Period**: 5 seconds

### Authentication
- **Username**: Driver ID (optional)
- **Password**: MQTT password (optional, set via environment variable)

### Client ID Format
```
driver_{driver_id}_{timestamp}
```
Example: `driver_12345_1705315200000`

## Topic Structure

All topics follow the pattern:
```
aeras/driver/{driver_id}/{action}
```

### Base Topics

| Topic Pattern | Description | Direction |
|--------------|-------------|-----------|
| `aeras/driver/{driver_id}/offer` | Ride offers | Subscribe |
| `aeras/driver/{driver_id}/status` | Status updates | Publish/Subscribe |
| `aeras/driver/{driver_id}/location` | Location updates | Publish |
| `aeras/driver/{driver_id}/ride_update` | Ride state updates | Subscribe |
| `aeras/driver/{driver_id}/system_status` | System status | Subscribe |

## Message Payloads

### Ride Offer (Test Case 6a)

**Topic**: `aeras/driver/{driver_id}/offer`  
**Direction**: App ← Backend  
**QoS**: 1

**Payload:**
```json
{
  "type": "ride_offer",
  "ride_id": "ride_67890",
  "pickup_location": {
    "latitude": 23.8103,
    "longitude": 90.4125,
    "address": "123 Main Street, Dhaka"
  },
  "destination_location": {
    "latitude": 23.8200,
    "longitude": 90.4200,
    "address": "456 Oak Avenue, Dhaka"
  },
  "fare": 50,
  "estimated_duration": 15,
  "estimated_distance": 2500,
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-15T10:31:00Z"
}
```

**App Behavior:**
1. Display notification modal with sound/vibration
2. Show 30-second countdown timer
3. If multiple offers → sort by distance (nearest first)
4. Auto-expire after 60 seconds if no acceptance
5. Auto-reject after 30 seconds if no action

**Offer Expiry:**
```json
{
  "type": "ride_offer_expired",
  "ride_id": "ride_67890",
  "reason": "timeout",
  "timestamp": "2024-01-15T10:31:00Z"
}
```

**Response (REST API):**
- Accept: `POST /api/ride/accept` (within 2 seconds)
- Reject: `POST /api/ride/reject`

### Driver Status

**Topic**: `aeras/driver/{driver_id}/status`  
**Direction**: App ↔ Backend  
**QoS**: 1

**Publish (App → Backend):**
```json
{
  "driver_id": "driver_12345",
  "status": "available", // "available" | "busy" | "offline"
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Subscribe (App ← Backend):**
```json
{
  "driver_id": "driver_12345",
  "status": "available",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Location Updates

**Topic**: `aeras/driver/{driver_id}/location`  
**Direction**: App → Backend  
**QoS**: 1  
**Frequency**: Every 5 seconds

**Payload:**
```json
{
  "driver_id": "driver_12345",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "accuracy": 10.5,
  "heading": 90.0,
  "speed": 25.5,
  "timestamp": "2024-01-15T10:30:05Z"
}
```

**Note:** Location is also sent via REST API (`POST /api/driver/location`) for reliability.

### Ride Update

**Topic**: `aeras/driver/{driver_id}/ride_update`  
**Direction**: App ← Backend  
**QoS**: 1

**Pickup Confirmed:**
```json
{
  "type": "pickup_confirmed",
  "ride_id": "ride_67890",
  "status": "picked_up",
  "pickup_location": {
    "latitude": 23.8103,
    "longitude": 90.4125
  },
  "led_status": "green", // Green LED ON (Test Case 6c)
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Accept Confirmation:**
```json
{
  "type": "accepted",
  "ride_id": "ride_67890",
  "status": "accepted",
  "led_status": "yellow", // Yellow LED ON (Test Case 6b)
  "message": "Accepted – User will see Yellow LED",
  "timestamp": "2024-01-15T10:30:02Z"
}
```

**Drop-off Verified:**
```json
{
  "type": "dropoff_verified",
  "ride_id": "ride_67890",
  "status": "completed",
  "points_awarded": 25,
  "led_status": "off",
  "timestamp": "2024-01-15T10:50:00Z"
}
```

**Ride Cancelled:**
```json
{
  "type": "ride_cancelled",
  "ride_id": "ride_67890",
  "reason": "Driver cancelled",
  "status": "cancelled",
  "timestamp": "2024-01-15T10:40:00Z"
}
```

### System Status

**Topic**: `aeras/driver/{driver_id}/system_status`  
**Direction**: App ← Backend  
**QoS**: 1

**Payload:**
```json
{
  "status": "normal", // "normal" | "warning" | "error"
  "message": "System operating normally",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Warning Example:**
```json
{
  "status": "warning",
  "message": "Ride offer expired",
  "timestamp": "2024-01-15T10:31:00Z"
}
```

**Error Example:**
```json
{
  "status": "error",
  "message": "Connection error",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Subscription Flow

### On Login
1. Connect to MQTT broker
2. Subscribe to all topics for driver:
   - `aeras/driver/{driver_id}/offer`
   - `aeras/driver/{driver_id}/status`
   - `aeras/driver/{driver_id}/ride_update`
   - `aeras/driver/{driver_id}/system_status`
3. Publish initial status: `available`
4. Start publishing location updates every 5 seconds

### On Logout
1. Publish status: `offline`
2. Unsubscribe from all topics
3. Disconnect from broker

### On Reconnection
1. Auto-reconnect (max 10 attempts)
2. Re-subscribe to all topics
3. Publish current status
4. Process offline queue (any pending messages)

## Offline Queue

When MQTT is disconnected, actions are queued in localStorage:

```javascript
{
  type: "mqtt_publish",
  topic: "aeras/driver/12345/location",
  payload: { /* location data */ },
  options: { qos: 1 },
  timestamp: 1705315200000
}
```

On reconnection, queued messages are sent automatically.

## Message Flow Diagrams

### Ride Offer Flow (Test Case 6a)

```
Backend → MQTT: Publish ride_offer
    ↓
App: Receive offer notification
    ↓
App: Display modal (sound + vibration)
    ↓
[30 seconds timeout]
    ↓
App → REST API: POST /ride/accept (within 2s)
    ↓
Backend → MQTT: Publish accepted (Yellow LED)
    ↓
App: Show confirmation, navigate to ride
```

### Pickup Confirmation Flow (Test Case 6c)

```
App: GPS detects within 20-50m of pickup
    ↓
App → REST API: POST /ride/pickup
    ↓
Backend → MQTT: Publish pickup_confirmed
    ↓
App: Show "Green LED ON" status
    ↓
Backend: Activate Green LED for user
```

### Drop-off Verification Flow (Test Case 6d)

```
App: GPS detects within ±50m of destination
    ↓
App: Auto-enable "Confirm Drop" button
    ↓
App → REST API: POST /ride/dropoff (with GPS)
    ↓
Backend: Verify GPS coordinates (±50m)
    ↓
If valid:
    Backend → MQTT: Publish dropoff_verified
    Backend: Award points
    App: Show points awarded
If invalid:
    Backend: Mark ride as PENDING
    App: Show pending verification message
```

## QoS and Reliability

- **QoS 1**: At least once delivery (messages may be duplicated)
- **Retain**: false (no retained messages)
- **Last Will**: Driver status set to "offline" on disconnect

## Keepalive and Reconnection

- **Keepalive**: 60 seconds
- **Reconnect Period**: 5 seconds
- **Max Reconnect Attempts**: 10
- **Backoff Strategy**: Linear (5s, 5s, 5s...)

## Security

- Use `wss://` (WebSocket over TLS) in production
- Authenticate with username/password
- Implement topic-level ACLs (one driver cannot access another's topics)
- Validate all incoming payloads

## Testing

### Test Scenarios

1. **Multiple Offers** - Send multiple ride offers, verify sorting by distance
2. **Offer Timeout** - Verify 60-second expiry (Test Case 6a)
3. **Accept Timeout** - Verify 30-second auto-reject
4. **Offline Queue** - Disconnect, queue actions, reconnect, verify sync
5. **Reconnection** - Kill connection, verify auto-reconnect

### Debug Commands

```bash
# Subscribe to all driver topics (testing)
mosquitto_sub -h localhost -p 1883 -t "aeras/driver/+/#" -v

# Publish test ride offer
mosquitto_pub -h localhost -p 1883 -t "aeras/driver/12345/offer" \
  -m '{"type":"ride_offer","ride_id":"test_123",...}'
```

## Notes

- All timestamps use ISO 8601 format (UTC)
- Payloads must be valid JSON
- App handles duplicate messages gracefully (idempotent operations)
- MQTT is used for real-time notifications, REST API for data operations

