# API Specification

This document describes the REST API endpoints used by the Rickshaw Puller App.

## Base URL

```
http://localhost:8000/api
```

Or set via environment variable:
```env
VITE_API_BASE_URL=http://your-backend-url/api
```

## Authentication

All requests require a `X-Driver-ID` header:
```
X-Driver-ID: driver_12345
```

## Endpoints

### Authentication

#### POST `/auth/login`
Login/Register a driver.

**Request:**
```json
{
  "driver_id": "driver_12345",
  "driver_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "driver_id": "driver_12345",
  "driver_name": "John Doe",
  "token": "jwt_token_here" // Optional
}
```

#### POST `/auth/logout`
Logout driver.

**Request:** None (uses header authentication)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Driver Endpoints

#### GET `/driver/profile`
Get driver profile information.

**Response:**
```json
{
  "driver_id": "driver_12345",
  "driver_name": "John Doe",
  "status": "available",
  "total_points": 1500,
  "total_rides": 45
}
```

#### POST `/driver/location`
Update driver's GPS location.

**Request:**
```json
{
  "latitude": 23.8103,
  "longitude": 90.4125,
  "accuracy": 10.5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated"
}
```

#### POST `/driver/status`
Update driver status (available/busy/offline).

**Request:**
```json
{
  "status": "available", // "available" | "busy" | "offline"
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "status": "available"
}
```

### Ride Endpoints

#### POST `/ride/accept`
Accept a ride offer.

**Request:**
```json
{
  "ride_id": "ride_67890",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "ride_id": "ride_67890",
  "status": "accepted",
  "pickup_location": {
    "latitude": 23.8103,
    "longitude": 90.4125,
    "address": "123 Main Street"
  },
  "destination_location": {
    "latitude": 23.8200,
    "longitude": 90.4200,
    "address": "456 Oak Avenue"
  },
  "fare": 50,
  "estimated_duration": 15
}
```

**Note:** Response must be received within 2 seconds for Test Case 6b compliance.

#### POST `/ride/reject`
Reject a ride offer.

**Request:**
```json
{
  "ride_id": "ride_67890",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride rejected"
}
```

#### POST `/ride/pickup`
Confirm pickup at location.

**Request:**
```json
{
  "ride_id": "ride_67890",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "ride_id": "ride_67890",
  "status": "picked_up",
  "pickup_confirmed_at": "2024-01-15T10:35:00Z",
  "message": "Pickup confirmed. Green LED activated."
}
```

**Note:** Activates Green LED for user (Test Case 6c).

#### POST `/ride/dropoff`
Confirm drop-off at destination.

**Request:**
```json
{
  "ride_id": "ride_67890",
  "latitude": 23.8200,
  "longitude": 90.4200,
  "timestamp": "2024-01-15T10:50:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "ride_id": "ride_67890",
  "status": "completed",
  "dropoff_confirmed_at": "2024-01-15T10:50:00Z",
  "points_awarded": 25,
  "message": "Drop-off confirmed. Points awarded."
}
```

**Note:** Auto-verifies GPS within ±50m radius (Test Case 6d).

#### POST `/ride/cancel`
Cancel an active ride.

**Request:**
```json
{
  "ride_id": "ride_67890",
  "reason": "Driver cancelled",
  "timestamp": "2024-01-15T10:40:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride cancelled"
}
```

#### GET `/ride/current`
Get current active ride.

**Response:**
```json
{
  "ride_id": "ride_67890",
  "status": "picked_up",
  "pickup_location": {
    "latitude": 23.8103,
    "longitude": 90.4125,
    "address": "123 Main Street"
  },
  "destination_location": {
    "latitude": 23.8200,
    "longitude": 90.4200,
    "address": "456 Oak Avenue"
  },
  "fare": 50,
  "accepted_at": "2024-01-15T10:30:00Z",
  "picked_up_at": "2024-01-15T10:35:00Z"
}
```

### Points Endpoints

#### GET `/points/balance`
Get current points balance.

**Response:**
```json
{
  "balance": 1500,
  "total_earned": 2500,
  "total_spent": 1000
}
```

#### GET `/points/history`
Get points history (last N rides).

**Query Parameters:**
- `limit` (optional, default: 10): Number of rides to return

**Response:**
```json
{
  "history": [
    {
      "ride_id": "ride_67890",
      "completed_at": "2024-01-15T10:50:00Z",
      "points_awarded": 25,
      "pickup_address": "123 Main Street",
      "destination_address": "456 Oak Avenue",
      "fare": 50,
      "distance": 2500,
      "status": "completed"
    },
    {
      "ride_id": "ride_67889",
      "completed_at": "2024-01-15T09:20:00Z",
      "points_awarded": 30,
      "pickup_address": "789 Elm Street",
      "destination_address": "321 Pine Avenue",
      "fare": 60,
      "distance": 3000,
      "status": "completed"
    }
  ]
}
```

#### GET `/points/pending`
Get pending verifications.

**Response:**
```json
{
  "pending": [
    {
      "id": "verification_123",
      "ride_id": "ride_67890",
      "pickup_address": "123 Main Street",
      "destination_address": "456 Oak Avenue",
      "status": "pending",
      "submitted_at": "2024-01-15T10:50:00Z"
    }
  ]
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error code",
  "message": "Human-readable error message",
  "details": {} // Optional additional details
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., ride already accepted)
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Request/Response Examples

### Accept Ride (Within 2 seconds)
```bash
curl -X POST http://localhost:8000/api/ride/accept \
  -H "Content-Type: application/json" \
  -H "X-Driver-ID: driver_12345" \
  -d '{
    "ride_id": "ride_67890",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### Update Location (Every 5 seconds)
```bash
curl -X POST http://localhost:8000/api/driver/location \
  -H "Content-Type: application/json" \
  -H "X-Driver-ID: driver_12345" \
  -d '{
    "latitude": 23.8103,
    "longitude": 90.4125,
    "accuracy": 10.5,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## Timing Requirements

Per Test Case specifications:

1. **Accept Ride Response**: Must be < 2 seconds (Test Case 6b)
2. **GPS Updates**: Every 5 seconds
3. **Ride Offer Timeout**: 60 seconds if no driver accepts (Test Case 6a)
4. **Accept Timeout**: 30 seconds before auto-reject
5. **Pickup Radius**: 20-50 meters (Test Case 6c)
6. **Drop-off Radius**: ±50 meters (Test Case 6d)

## Notes

- All timestamps use ISO 8601 format with timezone (UTC recommended)
- GPS coordinates use WGS84 (decimal degrees)
- Distance calculations use Haversine formula
- Points are awarded automatically on successful drop-off verification

