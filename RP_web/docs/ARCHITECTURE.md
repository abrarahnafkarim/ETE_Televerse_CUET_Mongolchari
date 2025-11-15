# Architecture Documentation

## System Architecture Overview

The Rickshaw Puller App is a client-side Progressive Web Application (PWA) built with React and designed for mobile browsers. It communicates with a backend server via REST API and MQTT for real-time notifications.

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Browser                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            React App (PWA)                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │  Components  │  │    Store     │  │ Services │ │   │
│  │  │   (UI)       │  │  (Zustand)   │  │ (Logic)  │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │           Service Worker                      │   │
│  │  │        (Offline Support)                      │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  GPS Service     │  │  LocalStorage    │              │
│  │  (HTML5 API)     │  │  (Persistence)   │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
            │                          │
            │                          │
    ┌───────▼────────┐        ┌───────▼────────┐
    │  REST API      │        │  MQTT Broker   │
    │  (HTTP/HTTPS)  │        │  (WebSocket)   │
    └───────┬────────┘        └───────┬────────┘
            │                          │
            └──────────┬───────────────┘
                       │
            ┌──────────▼──────────┐
            │   Backend Server    │
            │  (AERAS System)     │
            └─────────────────────┘
```

## Component Architecture

### Layer Structure

```
src/
├── components/        # Presentation Layer
│   ├── Map.jsx       # Google Maps integration
│   ├── RideNotificationModal.jsx
│   ├── NotificationBanner.jsx
│   └── ...
│
├── pages/            # Route Components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── RideDetail.jsx
│   └── ...
│
├── services/         # Business Logic Layer
│   ├── api.js       # REST API client
│   ├── mqtt.js      # MQTT client
│   ├── gps.js       # GPS tracking
│   └── storage.js   # LocalStorage wrapper
│
├── store/           # State Management
│   └── useAppStore.js  # Zustand store
│
└── config/          # Configuration
    └── index.js
```

## Data Flow

### Ride Offer Flow

```
1. Backend publishes ride offer via MQTT
   ↓
2. MQTT Service receives message
   ↓
3. Store action: addRideOffer()
   ↓
4. UI updates: Modal appears + Sound/Vibration
   ↓
5. User accepts → API call: POST /ride/accept
   ↓
6. Store updates: currentRide set
   ↓
7. UI navigates to RideDetail page
```

### GPS Tracking Flow

```
1. GPS Service: watchPosition() (HTML5 API)
   ↓
2. Location update every 5 seconds
   ↓
3. Store updates: currentLocation
   ↓
4. API Service: POST /driver/location (every 5s)
   ↓
5. Map Component: Updates marker position
   ↓
6. Distance calculations: Check pickup/destination radius
```

### State Persistence Flow

```
1. Zustand store changes
   ↓
2. Persist middleware intercepts
   ↓
3. Selected state → localStorage
   ↓
4. On app reload:
   ↓
5. Store initializes from localStorage
   ↓
6. Services reconnect (MQTT, GPS)
```

## Service Layer Details

### API Service (`src/services/api.js`)

**Responsibilities:**
- HTTP request/response handling
- Authentication header injection
- Error handling and retry logic
- Offline queue integration

**Key Methods:**
- `login(driverId, driverName)` - Authenticate driver
- `acceptRide(rideId)` - Accept ride (must be < 2s)
- `confirmPickup(rideId, lat, lng)` - Confirm pickup
- `confirmDropoff(rideId, lat, lng)` - Confirm drop-off
- `updateLocation(lat, lng, accuracy)` - GPS updates

**Error Handling:**
- Network errors → Queue for offline mode
- 401/403 → Redirect to login
- 409 → Handle race conditions
- Retry logic with exponential backoff

### MQTT Service (`src/services/mqtt.js`)

**Responsibilities:**
- WebSocket MQTT connection management
- Topic subscription/unsubscription
- Message publishing/receiving
- Auto-reconnection logic

**Key Methods:**
- `connect(driverId)` - Connect to broker
- `subscribe(topic)` - Subscribe to topic
- `publish(topic, payload)` - Publish message
- `onMessage(topic, handler)` - Register message handler
- `processOfflineQueue()` - Sync queued messages

**Connection Management:**
- Auto-reconnect on disconnect (max 10 attempts)
- Keepalive: 60 seconds
- Clean session: true
- Last will: Set status to "offline"

### GPS Service (`src/services/gps.js`)

**Responsibilities:**
- HTML5 Geolocation API wrapper
- Continuous position tracking
- Distance calculations (Haversine)
- Location updates to backend

**Key Methods:**
- `startTracking(callback)` - Start GPS tracking
- `stopTracking()` - Stop GPS tracking
- `calculateDistance(lat1, lon1, lat2, lon2)` - Calculate distance
- `isWithinRadius(...)` - Check if within radius

**Tracking Configuration:**
- Update interval: 5 seconds
- High accuracy: true
- Timeout: 10 seconds
- Maximum age: 5 seconds

### Storage Service (`src/services/storage.js`)

**Responsibilities:**
- LocalStorage wrapper
- Driver info persistence
- Current ride state persistence
- Offline action queue

**Key Methods:**
- `saveDriver(id, name)` - Save driver info
- `saveCurrentRide(ride)` - Persist ride state
- `addToOfflineQueue(action)` - Queue offline actions
- `getOfflineQueue()` - Get queued actions

**Storage Keys:**
- `rp_driver_id` - Driver ID
- `rp_driver_name` - Driver name
- `rp_current_ride` - Active ride data
- `rp_offline_queue` - Queued offline actions
- `rp_settings` - App settings
- `rp_last_location` - Last known location

## State Management (Zustand)

### Store Structure

```javascript
{
  // Auth
  driver: { id, name },
  isAuthenticated: boolean,

  // Ride
  currentRide: Ride | null,
  rideOffers: Ride[],
  rideHistory: Ride[],

  // Points
  pointsBalance: number,
  pendingVerifications: Verification[],

  // Location
  currentLocation: Location | null,
  isLocationEnabled: boolean,

  // System
  isOnline: boolean,
  connectionStatus: 'connected' | 'disconnected' | 'connecting',
  systemStatus: 'normal' | 'warning' | 'error',

  // UI
  showRideModal: boolean,
  activeNotification: Ride | null,
  isLoading: boolean,
  error: string | null,
}
```

### Key Actions

- `login(driverId, driverName)` - Authenticate and initialize services
- `logout()` - Cleanup and logout
- `addRideOffer(offer)` - Add incoming ride offer
- `acceptRide(rideId)` - Accept ride (within 2s)
- `confirmPickup(rideId, lat, lng)` - Confirm pickup
- `confirmDropoff(rideId, lat, lng)` - Confirm drop-off
- `loadPointsBalance()` - Fetch points balance
- `loadRideHistory()` - Fetch ride history

## UI Components

### Page Components

1. **Login** (`pages/Login.jsx`)
   - Driver ID/Name input
   - Form validation
   - Authentication flow

2. **Dashboard** (`pages/Dashboard.jsx`)
   - Points balance card
   - Active ride card (if any)
   - Recent rides list
   - Bottom navigation

3. **Ride Detail** (`pages/RideDetail.jsx`)
   - Interactive map with route
   - Pickup/destination info
   - Confirm pickup/drop-off buttons
   - Distance and ETA display

4. **Points** (`pages/Points.jsx`)
   - Total points display
   - Pending verifications
   - Ride history (last 10)

5. **Settings** (`pages/Settings.jsx`)
   - Driver info
   - System status
   - App settings (GPS interval, notifications)
   - Logout button

### Shared Components

1. **Map** (`components/Map.jsx`)
   - Google Maps integration
   - Route rendering
   - Marker management
   - Distance calculations

2. **RideNotificationModal** (`components/RideNotificationModal.jsx`)
   - Ride offer display
   - Accept/Reject buttons
   - 30-second countdown timer
   - Sound/vibration alerts

3. **NotificationBanner** (`components/NotificationBanner.jsx`)
   - System status display
   - Connection status
   - Warning/error messages

## Routing

### Route Structure

```
/ → Redirect to /dashboard or /login
/login → Login page
/dashboard → Dashboard (protected)
/ride/:rideId → Ride detail page (protected)
/points → Points page (protected)
/settings → Settings page (protected)
```

### Route Protection

- Routes check `isAuthenticated` from store
- Unauthenticated users redirected to `/login`
- Authenticated users accessing `/login` redirected to `/dashboard`

## PWA Features

### Service Worker

- **Registration**: Automatic via Vite PWA plugin
- **Caching Strategy**: 
  - Static assets: Cache First
  - API requests: Network First
  - Maps: Cache First (1 year)
- **Offline Support**: Offline action queue
- **Update Strategy**: Auto-update on reload

### Manifest

- **Name**: Rickshaw Puller App
- **Short Name**: RPA
- **Theme Color**: #1f2937
- **Icons**: 192x192, 512x512
- **Display**: standalone

## Real-time Communication

### MQTT Topics

```
aeras/driver/{driver_id}/offer        → Ride offers
aeras/driver/{driver_id}/status       → Status updates
aeras/driver/{driver_id}/location     → Location (published by app)
aeras/driver/{driver_id}/ride_update  → Ride state changes
aeras/driver/{driver_id}/system_status → System alerts
```

### Message Flow

1. **Ride Offer**: Backend → App (via MQTT)
2. **Accept/Reject**: App → Backend (via REST API, < 2s)
3. **Location**: App → Backend (via REST API, every 5s)
4. **Pickup/Drop-off**: App → Backend (via REST API)
5. **Status Updates**: Backend → App (via MQTT)

## Offline Support

### Offline Queue

Actions queued when offline:
- GPS location updates
- Ride accept/reject
- Pickup/drop-off confirmations
- Status updates

### Sync Strategy

On reconnection:
1. Reconnect MQTT
2. Process offline queue
3. Sync current state with backend
4. Resume normal operations

## Performance Optimizations

1. **Code Splitting**: Vendor chunks (react, maps, mqtt)
2. **Lazy Loading**: Route-based code splitting
3. **Minification**: Terser with dead code elimination
4. **Caching**: Service worker for static assets
5. **GPS Throttling**: Only send if moved > 10m
6. **Debouncing**: UI update debouncing

## Security Considerations

1. **HTTPS**: Required for geolocation API
2. **Authentication**: Driver ID in headers
3. **MQTT Security**: TLS/SSL in production (wss://)
4. **Input Validation**: All user inputs validated
5. **XSS Protection**: React's built-in escaping
6. **CORS**: Backend must allow app origin

## Error Handling

### Error Types

1. **Network Errors**: Offline queue, retry logic
2. **API Errors**: User-friendly messages, error banners
3. **GPS Errors**: Permission denied, unavailable
4. **MQTT Errors**: Auto-reconnect, fallback to polling

### Error Recovery

- **Network**: Retry with exponential backoff
- **GPS**: Show permission prompt
- **MQTT**: Auto-reconnect (max 10 attempts)
- **State**: Restore from localStorage

## Testing Strategy

### Unit Tests
- Service functions (API, GPS, Storage)
- Utility functions (distance calculations)
- Store actions

### Integration Tests
- MQTT connection flow
- GPS tracking flow
- Ride acceptance flow
- Offline queue processing

### E2E Tests
- Complete ride flow (offer → accept → pickup → drop-off)
- Offline mode → online sync
- Multiple ride offers handling

## Deployment

### Build Process

```bash
npm run build
```

Output: `dist/` directory with:
- Static HTML/CSS/JS
- Service worker files
- Manifest.json
- Assets

### Production Requirements

1. **HTTPS**: Required for geolocation
2. **Environment Variables**: Set in build process
3. **CORS**: Backend must allow app domain
4. **MQTT**: WSS (WebSocket Secure) required
5. **CDN**: Recommended for static assets

## Scalability Considerations

1. **MQTT**: Scales with broker infrastructure
2. **GPS Updates**: Throttle based on movement
3. **State Size**: Limit persisted state
4. **Cache Size**: Limit service worker cache
5. **Bundle Size**: Code splitting for large apps

## Future Enhancements

1. **Web Push Notifications**: Browser push API
2. **Background Sync**: Sync API for offline actions
3. **IndexedDB**: Larger data storage
4. **WebRTC**: Peer-to-peer communication
5. **Offline Maps**: Cache map tiles locally

