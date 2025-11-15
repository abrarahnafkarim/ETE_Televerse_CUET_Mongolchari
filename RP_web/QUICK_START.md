# Quick Start Guide

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000/api

# MQTT Broker URL (WebSocket)
VITE_MQTT_BROKER_URL=ws://localhost:8083/mqtt

# MQTT Credentials (optional)
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=

# Google Maps API Key (REQUIRED)
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# Environment
VITE_APP_ENV=development
```

### 3. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps JavaScript API** and **Places API**
4. Create API Key
5. Add to `.env` file

**Important**: Restrict API key to your domain for production!

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Test the App

1. **Login**
   - Enter Driver ID (e.g., `driver_001`)
   - Enter Driver Name (e.g., `John Doe`)
   - Click Login
   - Grant location permissions when prompted

2. **Test Ride Offer**
   - Ensure MQTT broker is running
   - Publish a test ride offer via MQTT:
   ```bash
   mosquitto_pub -h localhost -p 1883 \
     -t "aeras/driver/driver_001/offer" \
     -m '{"type":"ride_offer","ride_id":"test_123","pickup_location":{"latitude":23.8103,"longitude":90.4125,"address":"Pickup"},"destination_location":{"latitude":23.8200,"longitude":90.4200,"address":"Destination"},"fare":50}'
   ```
   - App should show notification modal

3. **Accept Ride**
   - Click "Accept" button
   - Navigate to Ride Detail screen
   - Map should load with route

## Production Build

```bash
npm run build
```

Output in `dist/` directory. Deploy to any static hosting service.

## Troubleshooting

### GPS Not Working
- Ensure you're using **HTTPS** (or localhost)
- Grant location permissions in browser
- Check device location services

### Maps Not Loading
- Verify Google Maps API key is correct
- Check API key restrictions in Google Cloud Console
- Ensure billing is enabled

### MQTT Connection Failed
- Verify broker URL (use `ws://` or `wss://`)
- Check broker is running
- Verify WebSocket is enabled on broker

### Backend API Errors
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings on backend
- Ensure backend is running

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) for API details
- Review [MQTT_PROTOCOL.md](./docs/MQTT_PROTOCOL.md) for MQTT protocol
- See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture details

