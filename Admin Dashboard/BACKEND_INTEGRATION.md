# Backend Integration Guide

This document provides instructions for connecting the AERAS Admin Dashboard to your backend server.

## Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://your-backend-url:8000
VITE_WS_URL=http://your-backend-url:8000
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_USE_MOCK_DATA=false
```

### 2. Disable Mock Data Mode

Set `VITE_USE_MOCK_DATA=false` to use the real backend instead of mock data.

## API Specification

### Base URL
All API endpoints should be prefixed with `/api/admin`

### Authentication

#### Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@aeras.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "admin": {
      "id": "admin_001",
      "name": "Admin User",
      "email": "admin@aeras.com",
      "role": "admin",
      "permissions": ["all"]
    }
  }
}
```

#### Logout
```http
POST /api/admin/logout
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

### Dashboard Statistics

```http
GET /api/admin/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "activeUsers": 333,
    "onlinePullers": 80,
    "activeRides": 24,
    "pendingReviews": 2,
    "totalRidesToday": 156,
    "averageWaitTime": 4.5,
    "averageRideTime": 18.3,
    "totalPointsDistributed": 12450
  }
}
```

### Rides

#### List Rides
```http
GET /api/admin/rides?page=1&pageSize=20&status=waiting,in-transit
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "items": [...],
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

#### Get Ride Details
```http
GET /api/admin/rides/{rideId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "ride_001",
    "userId": "usr_001",
    "userName": "John Okello",
    ...
  }
}
```

#### Cancel Ride
```http
POST /api/admin/rides/{rideId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "User requested cancellation"
}

Response:
{
  "success": true,
  "message": "Ride cancelled successfully"
}
```

#### Reassign Ride
```http
POST /api/admin/rides/{rideId}/reassign
Authorization: Bearer {token}
Content-Type: application/json

{
  "pullerId": "plr_005"
}

Response:
{
  "success": true,
  "message": "Ride reassigned successfully"
}
```

### Users

#### List Users
```http
GET /api/admin/users?page=1&pageSize=20&role=user&status=active
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "items": [...],
    "total": 450,
    "page": 1,
    "pageSize": 20,
    "totalPages": 23
  }
}
```

#### Suspend User
```http
POST /api/admin/users/{userId}/suspend
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Violation of terms of service",
  "duration": 7
}

Response:
{
  "success": true,
  "message": "User suspended for 7 days"
}
```

#### Ban User
```http
POST /api/admin/users/{userId}/ban
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Repeated violations"
}

Response:
{
  "success": true,
  "message": "User banned successfully"
}
```

#### Adjust Points
```http
POST /api/admin/users/{userId}/adjust-points
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50,
  "reason": "Compensation for system error"
}

Response:
{
  "success": true,
  "data": {
    "id": "adj_001",
    "userId": "usr_001",
    "userName": "John Okello",
    "adminId": "admin_001",
    "adminName": "Admin User",
    "amount": 50,
    "reason": "Compensation for system error",
    "previousBalance": 400,
    "newBalance": 450,
    "timestamp": "2024-11-13T10:30:00Z"
  }
}
```

### Reviews

#### List Reviews
```http
GET /api/admin/reviews?status=pending&page=1&pageSize=20
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "items": [...],
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

#### Approve Review
```http
POST /api/admin/reviews/{reviewId}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution": "GPS data verified. Points refunded to user."
}

Response:
{
  "success": true,
  "message": "Review approved successfully"
}
```

#### Reject Review
```http
POST /api/admin/reviews/{reviewId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Insufficient evidence provided"
}

Response:
{
  "success": true,
  "message": "Review rejected successfully"
}
```

### Analytics

#### Get Leaderboard
```http
GET /api/admin/analytics/leaderboard?limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "pullerId": "plr_002",
      "pullerName": "Peter Kato",
      "points": 3120,
      "rides": 203,
      "rating": 4.9
    },
    ...
  ]
}
```

#### Get Popular Destinations
```http
GET /api/admin/analytics/destinations?limit=5
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "blockId": "blk_004",
      "blockName": "Ntinda",
      "latitude": 0.3569,
      "longitude": 32.6267,
      "count": 87
    },
    ...
  ]
}
```

## WebSocket Integration

### Connection

```javascript
// Client connects with JWT token
socket.connect({
  auth: { token: jwtToken },
  transports: ['websocket', 'polling']
});
```

### Events to Emit (Server → Client)

#### Ride Updates
```javascript
socket.emit('ride_update', {
  id: 'ride_001',
  status: 'in-transit',
  pullerId: 'plr_002',
  timestamp: '2024-11-13T10:30:00Z'
});
```

#### Puller Location Updates
```javascript
socket.emit('puller_location', {
  id: 'plr_001',
  location: {
    latitude: 0.3341,
    longitude: 32.5702
  },
  timestamp: '2024-11-13T10:30:00Z'
});
```

#### Stats Updates
```javascript
socket.emit('stats_update', {
  activeRides: 25,
  onlinePullers: 82,
  timestamp: '2024-11-13T10:30:00Z'
});
```

#### Review Created
```javascript
socket.emit('review_created', {
  id: 'rev_003',
  type: 'gps_dispute',
  rideId: 'ride_005',
  timestamp: '2024-11-13T10:30:00Z'
});
```

### Events to Listen (Client → Server)

The dashboard doesn't emit custom events to the server but maintains the WebSocket connection for receiving updates.

## CORS Configuration

Your backend must allow requests from the dashboard domain:

```python
# Example for Python/Flask
from flask_cors import CORS

CORS(app, origins=[
    'http://localhost:3000',
    'https://admin.aeras.com'
])
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "User not found",
  "message": "The specified user ID does not exist"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Considerations

### JWT Token
- Include token in Authorization header: `Bearer {token}`
- Token should have reasonable expiration (1-24 hours)
- Implement refresh token mechanism
- Backend should validate token on every request

### Rate Limiting
- Implement rate limiting on backend
- Suggested: 100 requests per minute per IP

### Input Validation
- Validate all inputs on backend
- Sanitize user-provided data
- Check authorization for admin actions

## Testing the Integration

### 1. Test API Endpoints

```bash
# Test login
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aeras.com","password":"admin123"}'

# Test authenticated endpoint
curl http://localhost:8000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test WebSocket

```javascript
// In browser console
const socket = io('http://localhost:8000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.on('connect', () => console.log('Connected'));
socket.on('ride_update', (data) => console.log('Ride update:', data));
```

### 3. Monitor Network Tab

Use browser DevTools Network tab to:
- Verify API requests are sent correctly
- Check response status codes
- Inspect request/response payloads
- Monitor WebSocket messages

## Troubleshooting

### Dashboard shows "Disconnected"
- Check if WebSocket server is running
- Verify VITE_WS_URL is correct
- Check browser console for connection errors
- Ensure CORS is configured correctly

### API requests fail with 401
- Token might be expired
- Token format might be incorrect
- Backend authentication logic might have issues

### Mock data still showing
- Ensure `.env` file exists and has `VITE_USE_MOCK_DATA=false`
- Restart dev server after changing .env
- Check browser console for API errors

### Map not displaying
- Verify VITE_MAPBOX_TOKEN is set
- Check Mapbox token is valid
- Ensure token has necessary permissions

## Sample Backend Implementation (Python/FastAPI)

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import socketio

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)
socket_app = socketio.ASGIApp(sio, app)

@app.post("/api/admin/login")
async def login(credentials: LoginCredentials):
    # Validate credentials
    # Generate JWT token
    return {
        "success": True,
        "data": {
            "token": generated_token,
            "admin": admin_data
        }
    }

@app.get("/api/admin/stats")
async def get_stats(admin=Depends(verify_admin)):
    # Fetch stats from database
    return {"success": True, "data": stats}

@sio.on('connect')
async def connect(sid, environ, auth):
    # Verify JWT token from auth
    print(f'Client {sid} connected')

# Emit updates when data changes
async def on_ride_update(ride_data):
    await sio.emit('ride_update', ride_data)
```

## Contact

For backend integration support, contact the development team or refer to the backend API documentation.

