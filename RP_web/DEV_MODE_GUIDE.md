# Development Mode Guide

## ✅ Mock API Enabled

The app is now configured to work **without a backend server** in development mode!

## How to Use

### 1. Login with Any Credentials

You can now login with **any** Driver ID and Name:

**Example 1:**
- Driver ID: `driver_001`
- Driver Name: `Test Driver`

**Example 2:**
- Driver ID: `test123`
- Driver Name: `John Doe`

**Example 3:**
- Driver ID: `RP001`
- Driver Name: `Rahim Ali`

The mock API will accept any credentials and log you in successfully.

### 2. What Works in Mock Mode

✅ **Login/Logout** - Any credentials work  
✅ **Dashboard** - Shows points balance (starts at 0)  
✅ **GPS Tracking** - Will work if you grant location permission  
✅ **Maps** - Google Maps integration works (requires API key)  
✅ **Points Dashboard** - Shows balance and history  
✅ **Settings** - All settings work  

⚠️ **MQTT Notifications** - Will fail silently (expected in mock mode)  
⚠️ **Real-time Ride Offers** - Not available (needs real MQTT broker)  
⚠️ **Backend Sync** - No data persists to server  

### 3. Mock Features

The mock API simulates:
- Login authentication (accepts any credentials)
- Points balance (starts at 0)
- Ride acceptance (creates mock ride data)
- Pickup/drop-off confirmation
- Points awards (random 20-50 points per ride)

### 4. Console Logs

Check your browser console (F12) to see mock API activity:
```
🔧 [DEV MODE] Using mock API for login
🔧 [DEV MODE] Location update: {...}
🔧 [DEV MODE] Accepting ride: ride_123
```

## Configuration

Mock mode is controlled by `.env`:

```env
VITE_USE_MOCK_API=true
VITE_APP_ENV=development
```

To **disable** mock mode (use real backend):
```env
VITE_USE_MOCK_API=false
```

Or remove the `VITE_USE_MOCK_API` line entirely.

## Testing Ride Flow (Mock Mode)

Since ride offers come via MQTT (not available in mock mode), you can:

1. **Manually trigger a ride offer** in browser console:
```javascript
// Open browser console (F12) and run:
window.testRideOffer = {
  type: 'ride_offer',
  ride_id: 'test_ride_' + Date.now(),
  pickup_location: {
    latitude: 23.8103,
    longitude: 90.4125,
    address: '123 Main Street, Dhaka'
  },
  destination_location: {
    latitude: 23.8200,
    longitude: 90.4200,
    address: '456 Oak Avenue, Dhaka'
  },
  fare: 50,
  estimated_duration: 15,
  distance: 1000
}

// Dispatch the offer to the app
const store = window.__ZUSTAND_STORE__ || useAppStore.getState()
store.addRideOffer(window.testRideOffer)
```

Or test by accepting a ride through the UI if you have the ride modal component working.

## What to Expect

- ✅ Login works immediately
- ✅ Dashboard loads with 0 points
- ✅ GPS tracking prompts for permission (grant it to test maps)
- ✅ Maps work if you have Google Maps API key configured
- ✅ Settings page works
- ⚠️ MQTT connection will fail (this is expected)

## Next Steps

When your backend is ready:

1. Set `VITE_USE_MOCK_API=false` in `.env`
2. Ensure backend is running at `http://localhost:8000`
3. Restart the dev server: `npm run dev`
4. Login will now use the real backend

---

**Happy Testing! 🚀**

