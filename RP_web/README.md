# Rickshaw Puller App - AERAS Competition

A production-ready web application for rickshaw pullers built for the AERAS competition system. This app enables rickshaw pullers to receive ride requests, navigate to pickup and destination locations, confirm pickups/drop-offs, and track their points/rewards.

## 🚀 Features

### Core Features
- ✅ **Real-time Ride Notifications** - MQTT-based instant ride offer notifications with sound/vibration alerts
- ✅ **Accept/Reject Rides** - 30-second timeout for ride acceptance with auto-pass to next driver
- ✅ **GPS Tracking** - Continuous location tracking with 5-second interval updates
- ✅ **Interactive Maps** - Google Maps integration with turn-by-turn navigation
- ✅ **Pickup Confirmation** - Automatic pickup detection within 20-50m radius (Green LED activation)
- ✅ **Drop-off Verification** - Automatic destination detection within ±50m (GPS verification)
- ✅ **Points System** - Real-time points balance and ride history (last 10 rides)
- ✅ **Offline Support** - Service worker with offline queue management
- ✅ **Responsive Design** - Mobile-optimized UI for low-literacy users

### Test Case Compliance
- ✅ **Test Case 6a** - Real-time ride notifications with 60-second expiry
- ✅ **Test Case 6b** - Accept ride within 2 seconds, show "Accepted – User will see Yellow LED"
- ✅ **Test Case 6c** - Navigation with pickup confirmation (Green LED)
- ✅ **Test Case 6d** - Drop-off verification with GPS confirmation
- ✅ **Test Case 6e** - Points dashboard with history

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Google Maps API Key** (for mapping features)
- **MQTT Broker** (WebSocket-enabled, e.g., Mosquitto, HiveMQ)
- **Backend API Server** (AERAS competition backend)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd RP_web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_MQTT_BROKER_URL=ws://localhost:8083/mqtt
   VITE_MQTT_USERNAME=your_mqtt_username
   VITE_MQTT_PASSWORD=your_mqtt_password
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_APP_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🏗️ Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

To preview the production build:
```bash
npm run preview
```

## 📱 Usage

### Initial Setup
1. Open the app in a mobile browser (Chrome recommended)
2. Enter your **Driver ID** and **Driver Name**
3. Click **Login**
4. Grant location permissions when prompted

### Receiving Rides
1. The app automatically subscribes to ride offers via MQTT
2. When a ride offer arrives, a notification modal appears with:
   - Pickup and destination addresses
   - Distance to pickup
   - Fare amount
   - 30-second countdown timer
3. Click **Accept** to accept the ride (response within 2 seconds)
4. Click **Reject** to reject (ride passes to next driver)

### Active Ride
1. After accepting, you'll see the ride detail screen with:
   - Interactive map showing route
   - Current location marker
   - Pickup and destination markers
   - Distance and ETA
2. Navigate to pickup location
3. When within 20-50m of pickup, **Confirm Pickup** button activates
4. After pickup confirmation, Green LED activates for user
5. Navigate to destination
6. When within ±50m of destination, **Confirm Drop-off** button activates
7. On drop-off confirmation, points are awarded automatically

### Viewing Points
1. Navigate to **Points** tab
2. View:
   - Total points balance
   - Last 10 rides with points earned
   - Pending verifications (if any)

## 🏛️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API
- **Real-time**: MQTT (WebSocket)
- **HTTP Client**: Axios
- **PWA**: Vite PWA Plugin

### Project Structure
```
RP_web/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingOverlay.jsx
│   │   ├── Map.jsx
│   │   ├── NotificationBanner.jsx
│   │   └── RideNotificationModal.jsx
│   ├── config/              # Configuration
│   │   └── index.js
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Points.jsx
│   │   ├── RideDetail.jsx
│   │   └── Settings.jsx
│   ├── services/            # Core services
│   │   ├── api.js           # REST API client
│   │   ├── gps.js           # GPS tracking service
│   │   ├── mqtt.js          # MQTT client
│   │   └── storage.js       # LocalStorage service
│   ├── store/               # State management
│   │   └── useAppStore.js   # Zustand store
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── index.html               # HTML template
├── package.json
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── README.md
```

### Key Services

#### MQTT Service (`src/services/mqtt.js`)
- Handles WebSocket MQTT connection
- Subscribes to ride offers, status updates, and system messages
- Auto-reconnects on connection loss
- Offline queue management

#### GPS Service (`src/services/gps.js`)
- HTML5 Geolocation API wrapper
- Continuous tracking with configurable intervals
- Distance calculations (Haversine formula)
- Location persistence to backend

#### API Service (`src/services/api.js`)
- Axios-based REST API client
- Automatic auth header injection
- Error handling and retry logic
- Offline queue integration

#### Storage Service (`src/services/storage.js`)
- LocalStorage wrapper
- Driver info persistence
- Current ride state persistence
- Offline action queue

## 🔌 Backend Integration

### REST API Endpoints

See [API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) for detailed API documentation.

### MQTT Topics

See [MQTT_PROTOCOL.md](./docs/MQTT_PROTOCOL.md) for MQTT protocol details.

## 📊 State Management

The app uses **Zustand** for global state management with localStorage persistence.

### Key State Slices
- **Auth**: Driver info, authentication status
- **Ride**: Current ride, ride offers, ride history
- **Points**: Balance, pending verifications
- **Location**: Current GPS coordinates
- **System**: Connection status, online/offline status

## 🎨 UI/UX Features

### Mobile-First Design
- Responsive layouts for small screens
- Touch-friendly button sizes (minimum 44px)
- Large, readable fonts
- Simple color-coded status indicators

### Accessibility
- High contrast colors
- Clear button labels
- Icon + text combinations
- Screen reader support

### Offline Handling
- Service worker caching
- Offline action queue
- Auto-sync on reconnection
- Visual connection status indicators

## 🔐 Security Considerations

- Driver ID authentication via headers
- MQTT connection with username/password
- HTTPS required for production (geolocation API)
- LocalStorage encryption (optional, recommended for production)

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login/Logout flow
- [ ] Ride notification reception
- [ ] Accept/Reject ride
- [ ] GPS tracking accuracy
- [ ] Pickup confirmation within radius
- [ ] Drop-off confirmation within radius
- [ ] Points balance updates
- [ ] Offline mode functionality
- [ ] MQTT reconnection

## 🐛 Troubleshooting

### GPS Not Working
- Ensure HTTPS (geolocation requires secure context)
- Grant location permissions in browser
- Check device location services are enabled

### MQTT Connection Failed
- Verify broker URL (WebSocket protocol: `ws://` or `wss://`)
- Check firewall/proxy settings
- Verify MQTT credentials

### Maps Not Loading
- Verify Google Maps API key is valid
- Check API key restrictions (HTTP referrer)
- Ensure billing is enabled on Google Cloud Console

### Offline Mode Issues
- Clear browser cache and service worker
- Check browser console for errors
- Verify service worker registration

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |
| `VITE_MQTT_BROKER_URL` | MQTT broker WebSocket URL | Yes |
| `VITE_MQTT_USERNAME` | MQTT username | Optional |
| `VITE_MQTT_PASSWORD` | MQTT password | Optional |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `VITE_APP_ENV` | Environment (development/production) | No |

## 🚀 Deployment

### Production Build
1. Update `.env` with production values
2. Run `npm run build`
3. Deploy `dist` folder to web server (Nginx, Apache, etc.)
4. Ensure HTTPS is enabled (required for geolocation)

### Recommended Hosting
- **Netlify** - Automatic deployments from Git
- **Vercel** - Zero-config deployments
- **AWS S3 + CloudFront** - Scalable static hosting
- **Firebase Hosting** - Google Cloud integration

## 📄 License

This project is built for the AERAS competition system.

## 👥 Support

For issues or questions, refer to:
- [API Specification](./docs/API_SPECIFICATION.md)
- [MQTT Protocol](./docs/MQTT_PROTOCOL.md)
- [Architecture Documentation](./docs/ARCHITECTURE.md)

---

**Built for AERAS Competition** | Version 1.0.0

