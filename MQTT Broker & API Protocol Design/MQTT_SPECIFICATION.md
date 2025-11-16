# AERAS MQTT Broker & API Protocol Specification
## Operational Playbook v1.0

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Broker Selection & Architecture](#broker-selection--architecture)
3. [Deployment Configuration](#deployment-configuration)
4. [Topic Hierarchy](#topic-hierarchy)
5. [QoS & Message Policies](#qos--message-policies)
6. [Message Schemas](#message-schemas)
7. [Security Configuration](#security-configuration)
8. [Rate Limiting & ACL Rules](#rate-limiting--acl-rules)
9. [Backpressure & Queue Handling](#backpressure--queue-handling)
10. [Fallback Strategies](#fallback-strategies)
11. [Monitoring & Logging](#monitoring--logging)
12. [Client Implementation Guidelines](#client-implementation-guidelines)
13. [Security Checklist](#security-checklist)

---

## Executive Summary

This document provides a complete operational specification for the AERAS MQTT messaging infrastructure. The system uses MQTT 3.1.1/5.0 protocol for real-time communication between blocks (requesters), drivers, and admin systems.

**Key Design Decisions:**
- **Primary Broker**: EMQX (recommended for production) or Mosquitto (lightweight alternative)
- **Protocol**: MQTT 5.0 with fallback to 3.1.1
- **Security**: TLS 1.2+ with certificate-based authentication + JWT for API clients
- **Message Retention**: Location data retained, personal data ephemeral
- **QoS Strategy**: QoS 0 for telemetry, QoS 1 for business logic, QoS 2 for financial transactions

---

## Broker Selection & Architecture

### Broker Comparison: EMQX vs Mosquitto

| Feature | EMQX | Mosquitto |
|---------|------|-----------|
| **Scalability** | Excellent (clustering, horizontal scaling) | Good (single node, limited clustering) |
| **Performance** | High throughput (1M+ msg/sec) | Moderate (100K+ msg/sec) |
| **MQTT 5.0** | Full support | Full support |
| **Rule Engine** | Built-in (data transformation) | None |
| **Dashboard** | Web UI included | None (external tools) |
| **JWT Auth** | Native support | Plugin required |
| **Resource Usage** | Higher (Java/Erlang) | Lower (C) |
| **Production Ready** | Enterprise-grade | Lightweight, reliable |
| **Cost** | Open source + Enterprise options | Fully open source |

### Recommendation

**Production**: Use **EMQX** for scalability, built-in features, and enterprise support.
**Development/Testing**: Use **Mosquitto** for simplicity and lower resource usage.

### Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Blocks    │────▶│             │◀────│   Drivers  │
│  (Request)  │     │   MQTT      │     │  (Offer)   │
└─────────────┘     │   Broker    │     └─────────────┘
                    │  (EMQX/     │
┌─────────────┐     │  Mosquitto) │     ┌─────────────┐
│   Admin     │────▶│             │◀────│  Monitoring│
│  (Commands) │     │             │     │  (Metrics) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   TLS/SSL   │
                    │  Auth/JWT   │
                    └─────────────┘
```

---

## Deployment Configuration

### Prerequisites
- Docker & Docker Compose
- OpenSSL (for certificate generation)
- Ports: 1883 (MQTT), 8883 (MQTTS), 18083 (EMQX Dashboard), 9001 (WebSocket)

### TLS Certificate Setup

Generate CA and server certificates:

```bash
# Create directory structure
mkdir -p certs/{ca,server,client}

# Generate CA private key
openssl genrsa -out certs/ca/ca.key 2048

# Generate CA certificate
openssl req -new -x509 -days 3650 -key certs/ca/ca.key -out certs/ca/ca.crt \
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=AERAS-CA"

# Generate server private key
openssl genrsa -out certs/server/server.key 2048

# Generate server CSR
openssl req -new -key certs/server/server.key -out certs/server/server.csr \
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=mqtt.aeras.local"

# Sign server certificate
openssl x509 -req -in certs/server/server.csr -CA certs/ca/ca.crt \
  -CAkey certs/ca/ca.key -CAcreateserial -out certs/server/server.crt -days 365

# Set permissions
chmod 600 certs/**/*.key
```

---

## Topic Hierarchy

### Topic Structure

All topics follow the pattern: `aeras/{entity}/{id}/{action}`

### Core Topics

#### Block (Requester) Topics
```
aeras/block/{blockId}/request          # Block publishes ride request
aeras/block/{blockId}/status           # Block receives request status updates
aeras/block/{blockId}/driver/assigned  # Block receives driver assignment
aeras/block/{blockId}/trip/status      # Block receives trip progress updates
```

#### Driver Topics
```
aeras/driver/{driverId}/offer          # Driver publishes offer
aeras/driver/{driverId}/location       # Driver publishes GPS location
aeras/driver/{driverId}/request        # Driver subscribes to nearby requests
aeras/driver/{driverId}/trip/accept    # Driver accepts trip
aeras/driver/{driverId}/trip/reject    # Driver rejects trip
aeras/driver/{driverId}/trip/status     # Driver publishes trip status
aeras/driver/{driverId}/points          # Driver receives points updates
```

#### Admin Topics
```
aeras/admin/{adminId}/commands         # Admin publishes commands
aeras/admin/{adminId}/notifications    # Admin receives system notifications
aeras/admin/broadcast                  # Broadcast to all admins
```

#### System Topics
```
aeras/system/heartbeat                 # Device heartbeat (all devices)
aeras/system/alerts                    # System alerts
aeras/system/metrics                  # System metrics (retained)
```

### Topic Examples

```
aeras/block/BLK-001/request
aeras/driver/DRV-0423/offer
aeras/driver/DRV-0423/location
aeras/admin/ADM-001/commands
```

### Wildcard Subscriptions

- Drivers subscribe to: `aeras/block/+/request` (all block requests)
- Blocks subscribe to: `aeras/driver/{driverId}/+` (all driver updates for their assigned driver)
- Admin subscribes to: `aeras/+/+/+` (all topics, with ACL restrictions)

---

## QoS & Message Policies

### QoS Level Recommendations

| Topic Pattern | QoS | Rationale |
|---------------|-----|-----------|
| `aeras/block/{id}/request` | 1 | Must be delivered, but duplicates acceptable |
| `aeras/driver/{id}/offer` | 1 | Critical business logic, at-least-once delivery |
| `aeras/driver/{id}/location` | 0 | High frequency, loss acceptable (next update soon) |
| `aeras/driver/{id}/trip/accept` | 2 | Financial transaction, exactly-once required |
| `aeras/driver/{id}/points` | 2 | Financial data, exactly-once required |
| `aeras/system/heartbeat` | 0 | Telemetry, loss acceptable |
| `aeras/admin/{id}/commands` | 1 | Commands must be delivered |

### Retained Messages

**Retain = true** for:
- `aeras/driver/{driverId}/location` (last known location)
- `aeras/system/metrics` (current system state)
- `aeras/block/{blockId}/status` (current request status)

**Retain = false** for:
- All personal data (PII)
- Request/offer messages (ephemeral)
- Heartbeat messages

### Last Will and Testament (LWT)

All clients must set LWT for offline detection:

**Block LWT:**
```
Topic: aeras/block/{blockId}/status
Payload: {"status":"offline","timestamp":"2024-01-01T12:00:00Z"}
QoS: 1
Retain: true
```

**Driver LWT:**
```
Topic: aeras/driver/{driverId}/status
Payload: {"status":"offline","timestamp":"2024-01-01T12:00:00Z"}
QoS: 1
Retain: true
```

**LWT Detection:**
- System monitors LWT messages to detect device disconnections
- Offline devices are marked unavailable within 30 seconds
- Admin dashboard shows device connectivity status

---

## Message Schemas

### Common Message Structure

All messages include:
```json
{
  "messageId": "uuid-v4",
  "timestamp": "ISO8601",
  "version": "1.0",
  "senderId": "entity-id"
}
```

### 1. Request Message (Block → System)

**Topic**: `aeras/block/{blockId}/request`

```json
{
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "senderId": "BLK-001",
  "type": "request",
  "payload": {
    "requestId": "REQ-20240115-001",
    "pickupLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY"
    },
    "dropoffLocation": {
      "latitude": 40.7589,
      "longitude": -73.9851,
      "address": "456 Park Ave, New York, NY"
    },
    "passengerCount": 2,
    "vehicleType": "standard",
    "priority": "normal",
    "maxWaitTime": 300,
    "estimatedDistance": 5.2,
    "estimatedDuration": 900
  }
}
```

### 2. Offer Message (Driver → System)

**Topic**: `aeras/driver/{driverId}/offer`

```json
{
  "messageId": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-01-15T10:30:15Z",
  "version": "1.0",
  "senderId": "DRV-0423",
  "type": "offer",
  "payload": {
    "offerId": "OFF-20240115-001",
    "requestId": "REQ-20240115-001",
    "driverLocation": {
      "latitude": 40.7150,
      "longitude": -74.0080
    },
    "estimatedArrival": 180,
    "fare": {
      "amount": 15.50,
      "currency": "USD"
    },
    "vehicleInfo": {
      "type": "standard",
      "licensePlate": "ABC-1234",
      "capacity": 4
    },
    "driverRating": 4.8,
    "expiresAt": "2024-01-15T10:33:15Z"
  }
}
```

### 3. Accept Message (Block → Driver)

**Topic**: `aeras/block/{blockId}/trip/accept`

```json
{
  "messageId": "770e8400-e29b-41d4-a716-446655440002",
  "timestamp": "2024-01-15T10:30:30Z",
  "version": "1.0",
  "senderId": "BLK-001",
  "type": "accept",
  "payload": {
    "requestId": "REQ-20240115-001",
    "offerId": "OFF-20240115-001",
    "driverId": "DRV-0423",
    "tripId": "TRP-20240115-001",
    "acceptedAt": "2024-01-15T10:30:30Z"
  }
}
```

### 4. Reject Message (Block → Driver)

**Topic**: `aeras/block/{blockId}/trip/reject`

```json
{
  "messageId": "880e8400-e29b-41d4-a716-446655440003",
  "timestamp": "2024-01-15T10:30:25Z",
  "version": "1.0",
  "senderId": "BLK-001",
  "type": "reject",
  "payload": {
    "requestId": "REQ-20240115-001",
    "offerId": "OFF-20240115-001",
    "reason": "driver_too_far",
    "rejectedAt": "2024-01-15T10:30:25Z"
  }
}
```

### 5. Pickup Message (Driver → System)

**Topic**: `aeras/driver/{driverId}/trip/pickup`

```json
{
  "messageId": "990e8400-e29b-41d4-a716-446655440004",
  "timestamp": "2024-01-15T10:35:00Z",
  "version": "1.0",
  "senderId": "DRV-0423",
  "type": "pickup",
  "payload": {
    "tripId": "TRP-20240115-001",
    "requestId": "REQ-20240115-001",
    "pickupLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-01-15T10:35:00Z"
    },
    "pickupTime": "2024-01-15T10:35:00Z"
  }
}
```

### 6. Drop Message (Driver → System)

**Topic**: `aeras/driver/{driverId}/trip/drop`

```json
{
  "messageId": "aa0e8400-e29b-41d4-a716-446655440005",
  "timestamp": "2024-01-15T10:50:00Z",
  "version": "1.0",
  "senderId": "DRV-0423",
  "type": "drop",
  "payload": {
    "tripId": "TRP-20240115-001",
    "requestId": "REQ-20240115-001",
    "dropoffLocation": {
      "latitude": 40.7589,
      "longitude": -73.9851,
      "timestamp": "2024-01-15T10:50:00Z"
    },
    "dropoffTime": "2024-01-15T10:50:00Z",
    "tripSummary": {
      "distance": 5.3,
      "duration": 900,
      "fare": {
        "amount": 15.50,
        "currency": "USD"
      }
    }
  }
}
```

### 7. Heartbeat Message (All Devices)

**Topic**: `aeras/system/heartbeat`

```json
{
  "messageId": "bb0e8400-e29b-41d4-a716-446655440006",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "senderId": "DRV-0423",
  "type": "heartbeat",
  "payload": {
    "deviceType": "driver",
    "deviceId": "DRV-0423",
    "status": "online",
    "batteryLevel": 85,
    "signalStrength": -65,
    "uptime": 3600
  }
}
```

### 8. Points Update Message (System → Driver)

**Topic**: `aeras/driver/{driverId}/points`

```json
{
  "messageId": "cc0e8400-e29b-41d4-a716-446655440007",
  "timestamp": "2024-01-15T10:50:05Z",
  "version": "1.0",
  "senderId": "SYSTEM",
  "type": "points_update",
  "payload": {
    "driverId": "DRV-0423",
    "tripId": "TRP-20240115-001",
    "pointsEarned": 155,
    "pointsTotal": 5420,
    "transactionId": "TXN-20240115-001",
    "reason": "trip_completed"
  }
}
```

### 9. Location Update (Driver → System)

**Topic**: `aeras/driver/{driverId}/location`

```json
{
  "messageId": "dd0e8400-e29b-41d4-a716-446655440008",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "senderId": "DRV-0423",
  "type": "location",
  "payload": {
    "latitude": 40.7150,
    "longitude": -74.0080,
    "altitude": 10.5,
    "accuracy": 5.0,
    "heading": 45.0,
    "speed": 25.5,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 10. Admin Command (Admin → System)

**Topic**: `aeras/admin/{adminId}/commands`

```json
{
  "messageId": "ee0e8400-e29b-41d4-a716-446655440009",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "senderId": "ADM-001",
  "type": "admin_command",
  "payload": {
    "command": "suspend_driver",
    "targetId": "DRV-0423",
    "reason": "violation",
    "duration": 3600,
    "metadata": {
      "adminNotes": "Reported by passenger"
    }
  }
}
```

---

## Security Configuration

### Authentication Methods

1. **Username/Password** (Primary for devices)
2. **JWT Tokens** (Primary for API clients)
3. **Certificate-based** (Optional, for high-security deployments)

### User Management

Create users with appropriate permissions:

```bash
# EMQX CLI
./bin/emqx_ctl users add driver_0423 "secure_password_123" \
  --tags driver --description "Driver DRV-0423"

# Mosquitto (password file)
mosquitto_passwd -c /mosquitto/config/passwd driver_0423
```

### JWT Configuration

JWT payload structure:
```json
{
  "sub": "driver_0423",
  "iat": 1705315200,
  "exp": 1705401600,
  "role": "driver",
  "permissions": [
    "aeras/driver/DRV-0423/+",
    "aeras/block/+/request"
  ]
}
```

---

## Rate Limiting & ACL Rules

### Rate Limiting Policy

| Client Type | Max Messages/sec | Max Connections | Max Inflight |
|-------------|------------------|----------------|--------------|
| Block | 10 | 1 | 5 |
| Driver | 50 | 1 | 10 |
| Admin | 100 | 1 | 20 |
| System | 1000 | 1 | 100 |

### ACL Rules

**Driver ACL:**
```
# Driver can publish to their own topics
allow driver/{driverId} aeras/driver/{driverId}/+
allow driver/{driverId} aeras/system/heartbeat

# Driver can subscribe to block requests
allow driver/{driverId} aeras/block/+/request

# Driver can subscribe to their own updates
allow driver/{driverId} aeras/driver/{driverId}/+
```

**Block ACL:**
```
# Block can publish requests
allow block/{blockId} aeras/block/{blockId}/request
allow block/{blockId} aeras/block/{blockId}/trip/+

# Block can subscribe to status updates
allow block/{blockId} aeras/block/{blockId}/+
allow block/{blockId} aeras/driver/+/trip/status
```

**Admin ACL:**
```
# Admin can publish commands
allow admin/{adminId} aeras/admin/{adminId}/commands
allow admin/{adminId} aeras/admin/broadcast

# Admin can subscribe to all topics (read-only for most)
allow admin/{adminId} aeras/+/+/+
```

### Message Storm Prevention

1. **Per-client rate limiting**: 50 msg/sec per driver
2. **Topic-level throttling**: Max 1 location update per second per driver
3. **Connection limits**: Max 1 concurrent connection per device ID
4. **Message size limits**: Max 64KB per message
5. **Subscription limits**: Max 50 subscriptions per client

---

## Backpressure & Queue Handling

### Broker Settings

**EMQX Configuration:**
```hcl
# Maximum inflight messages per client
zone.external.max_inflight = 100

# Maximum message queue length
zone.external.max_mqueue_len = 1000

# Message queue priority
zone.external.mqueue_priorities = "none"

# Message expiry
zone.external.message_expiry_interval = 3600s
```

**Mosquitto Configuration:**
```conf
# Maximum inflight messages
max_inflight_messages 100

# Maximum queued messages
max_queued_messages 1000

# Queue QoS 0 messages
queue_qos0_messages true
```

### Client Reconnect Strategy

**Exponential Backoff Pseudocode:**
```
function reconnect(client, maxRetries = 10) {
    let baseDelay = 1000; // 1 second
    let maxDelay = 60000; // 60 seconds
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            delay = min(baseDelay * (2 ^ retryCount), maxDelay);
            sleep(delay);
            
            if (client.connect()) {
                return true; // Success
            }
        } catch (error) {
            log("Reconnect attempt " + retryCount + " failed: " + error);
            retryCount++;
        }
    }
    
    // All retries failed, trigger fallback
    triggerFallback();
    return false;
}
```

### Queue Handling

1. **Priority Queues**: Financial messages (QoS 2) have highest priority
2. **Message Expiry**: Non-critical messages expire after 1 hour
3. **Queue Overflow**: When queue is full, drop oldest QoS 0 messages first
4. **Client Disconnect**: Preserve QoS 1/2 messages for 24 hours

---

## Fallback Strategies

### HTTP REST Webhook Fallback

When MQTT is unavailable, clients should fall back to HTTP REST API:

**Endpoint**: `https://api.aeras.local/v1/messages`

**Request Format:**
```json
POST /v1/messages
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "topic": "aeras/driver/DRV-0423/location",
  "qos": 0,
  "payload": {
    "latitude": 40.7150,
    "longitude": -74.0080,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Fallback Logic:**
```
if (mqtt_connected == false) {
    if (message_priority == "critical") {
        send_via_http_webhook(message);
    } else {
        queue_for_later(message);
    }
}
```

### SMS Fallback via GSM

For critical messages when both MQTT and HTTP fail:

**Use Cases:**
- Driver assignment confirmation
- Emergency alerts
- Payment confirmations

**Implementation:**
```
function sendSMSFallback(message) {
    if (message.type == "trip_assigned" || 
        message.type == "payment_confirmed" ||
        message.priority == "emergency") {
        
        sms_gateway.send({
            to: getDevicePhoneNumber(message.recipientId),
            body: formatSMSMessage(message)
        });
    }
}
```

**SMS Message Format:**
```
AERAS Alert: Trip TRP-001 assigned to you. 
Driver: DRV-0423
Pickup: 123 Main St
Reply STOP to opt out
```

---

## Monitoring & Logging

### Prometheus Metrics

**Key Metrics to Export:**

1. **Connection Metrics:**
   - `mqtt_connections_total` - Total connections
   - `mqtt_connections_active` - Active connections
   - `mqtt_connections_rejected` - Rejected connections

2. **Message Metrics:**
   - `mqtt_messages_published_total{topic, qos}` - Published messages
   - `mqtt_messages_received_total{topic, qos}` - Received messages
   - `mqtt_messages_dropped_total{reason}` - Dropped messages

3. **Performance Metrics:**
   - `mqtt_message_latency_seconds` - Message processing latency
   - `mqtt_queue_size` - Message queue size
   - `mqtt_inflight_messages` - Inflight messages

4. **Error Metrics:**
   - `mqtt_errors_total{type}` - Error counts by type
   - `mqtt_auth_failures_total` - Authentication failures

### Grafana Dashboard Recommendations

**Dashboard Panels:**

1. **Connection Health**
   - Active connections over time
   - Connection rate
   - Rejected connections

2. **Message Throughput**
   - Messages per second by topic
   - Messages per second by QoS level
   - Message size distribution

3. **System Performance**
   - CPU/Memory usage
   - Message latency (p50, p95, p99)
   - Queue depth

4. **Error Tracking**
   - Error rate by type
   - Authentication failures
   - Message delivery failures

5. **Device Status**
   - Online/offline devices
   - Last heartbeat time
   - Device connectivity map

### Logging Configuration

**Log Levels:**
- **ERROR**: Connection failures, authentication errors, message delivery failures
- **WARN**: Rate limit violations, queue overflow, high latency
- **INFO**: Connection/disconnection events, configuration changes
- **DEBUG**: Message routing, ACL checks (development only)

**Log Format:**
```
[2024-01-15T10:30:00Z] [INFO] [MQTT] Client 'driver_0423' connected from 192.168.1.100:54321
[2024-01-15T10:30:01Z] [INFO] [MQTT] Published message to 'aeras/driver/DRV-0423/location' (QoS 0, 245 bytes)
[2024-01-15T10:30:02Z] [WARN] [MQTT] Rate limit exceeded for client 'driver_0423' (60 msg/sec)
```

---

## Client Implementation Guidelines

### Connection Parameters

- **Keep Alive**: 60 seconds
- **Clean Session**: false (for persistent sessions)
- **Client ID**: Must be unique per device (e.g., `BLK-001`, `DRV-0423`)
- **Will Topic**: Set LWT for offline detection
- **Reconnect**: Automatic with exponential backoff

### Best Practices

1. **Always set LWT** for offline detection
2. **Use appropriate QoS** based on message criticality
3. **Implement message queuing** for offline scenarios
4. **Validate message schemas** before publishing
5. **Handle connection failures** gracefully with fallback
6. **Monitor message delivery** (PUBACK, PUBREC, PUBCOMP)
7. **Implement idempotency** for financial transactions

---

## Security Checklist

### Pre-Production Security Checklist

- [ ] TLS 1.2+ enabled with valid certificates
- [ ] Strong password policy enforced (min 12 chars, complexity)
- [ ] JWT tokens with short expiration (1 hour)
- [ ] ACL rules configured and tested
- [ ] Rate limiting enabled per client type
- [ ] Message size limits enforced (64KB max)
- [ ] Connection limits per client ID (1 max)
- [ ] Certificate validation enabled
- [ ] Weak ciphers disabled
- [ ] Authentication logs enabled
- [ ] Failed login attempt monitoring
- [ ] Regular certificate rotation schedule
- [ ] Secrets stored in secure vault (not in code)
- [ ] Network isolation (VPN/firewall rules)
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented
- [ ] Backup and disaster recovery tested
- [ ] Monitoring alerts configured for anomalies

---

## Appendix

### Message Type Reference

| Type | Topic Pattern | QoS | Retain | Frequency |
|------|---------------|-----|--------|-----------|
| request | `aeras/block/{id}/request` | 1 | false | On-demand |
| offer | `aeras/driver/{id}/offer` | 1 | false | On-demand |
| accept | `aeras/block/{id}/trip/accept` | 2 | false | On-demand |
| reject | `aeras/block/{id}/trip/reject` | 1 | false | On-demand |
| pickup | `aeras/driver/{id}/trip/pickup` | 1 | false | On-demand |
| drop | `aeras/driver/{id}/trip/drop` | 1 | false | On-demand |
| location | `aeras/driver/{id}/location` | 0 | true | 1/sec |
| heartbeat | `aeras/system/heartbeat` | 0 | false | 30/sec |
| points | `aeras/driver/{id}/points` | 2 | false | On-demand |

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 0x00 | Success | None |
| 0x01 | Unacceptable protocol version | Upgrade client |
| 0x02 | Identifier rejected | Use valid client ID |
| 0x03 | Server unavailable | Retry with backoff |
| 0x04 | Bad username/password | Check credentials |
| 0x05 | Not authorized | Check ACL rules |
| 0x80 | Unspecified error | Check logs |
| 0x81 | Malformed packet | Validate message format |
| 0x82 | Protocol error | Check MQTT version |
| 0x83 | Implementation specific | Contact support |

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Maintained By**: AERAS IoT Architecture Team

