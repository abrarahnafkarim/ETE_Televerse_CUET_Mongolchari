# Setup Instructions

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```bash
# On Windows PowerShell
Copy-Item ".env.example" ".env"
```

Or manually create `.env` with:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_MQTT_BROKER_URL=ws://localhost:8083/mqtt
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
VITE_APP_ENV=development
```

### 3. Create PWA Icons (Optional)

The app needs PWA icons for the manifest. You can:

**Option A: Use the icon generator**
1. Open `scripts/create-icons.html` in a browser
2. Click the download buttons to save icons
3. Place `pwa-192x192.png` and `pwa-512x512.png` in the `public/` folder

**Option B: Create your own**
- Create 192x192 and 512x512 PNG icons
- Place them in the `public/` folder as `pwa-192x192.png` and `pwa-512x512.png`

**Option C: Use placeholder (development)**
- The app will work without icons, but PWA features may be limited

### 4. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Maps JavaScript API** and **Places API**
4. Create an API key
5. Add the key to your `.env` file:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

### 5. Configure Backend URLs

Update `.env` with your backend URLs:

```env
VITE_API_BASE_URL=http://your-backend-url/api
VITE_MQTT_BROKER_URL=ws://your-mqtt-broker-url/mqtt
```

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 7. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Troubleshooting

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

If port 3000 is already in use, Vite will automatically try the next available port.

### Environment Variables Not Loading

- Ensure `.env` file is in the root directory
- Restart the dev server after changing `.env`
- Variables must start with `VITE_` to be accessible in the app

### GPS Not Working

- Ensure you're using HTTPS (or localhost)
- Grant location permissions in browser
- Check device location services are enabled

### Maps Not Loading

- Verify Google Maps API key is correct
- Check API key restrictions in Google Cloud Console
- Ensure billing is enabled (free tier available)

### MQTT Connection Failed

- Verify broker URL uses `ws://` or `wss://` protocol
- Check broker is running
- Verify WebSocket is enabled on broker

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [QUICK_START.md](./QUICK_START.md) for quick start guide
- Review [API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) for API details
- See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture details

