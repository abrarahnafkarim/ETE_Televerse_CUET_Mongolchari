# ⚡ AERAS Admin Dashboard - Quick Reference

## 🎯 System in 30 Seconds

**What it is:** Real-time web dashboard for managing ride-sharing platform.  
**Tech:** React 18 + TypeScript + Vite.  
**Real-time:** WebSocket updates every 5 seconds.  
**Maps:** Mapbox (with OpenStreetMap fallback).  
**Deploy:** Docker multi-stage build with Nginx.  
**Works offline:** Mock data system included.

---

## 🗺️ Mapbox Integration

**How it works:** Reads `VITE_MAPBOX_TOKEN` from environment.  
**If token exists:** Uses Mapbox Streets v12 style (high quality).  
**If no token:** Falls back to OpenStreetMap (free, slower).  
**Features:** Color-coded ride pins, moving driver markers, GPS path lines.  
**Setup:** Get free token at mapbox.com, add to `.env.local`, restart server.

---

## 🐳 Docker Deployment

**Build process:** Two-stage build (Node.js builder → Nginx production).  
**Stage 1:** Compiles React app with Vite.  
**Stage 2:** Serves static files via Nginx Alpine.  
**Build args:** `VITE_API_URL`, `VITE_WS_URL`, `VITE_MAPBOX_TOKEN`, `VITE_USE_MOCK_DATA`.  
**Run:** `docker build -t aeras-dashboard .` then `docker run -p 8080:80 aeras-dashboard`.  
**Size:** ~50MB final image.  
**Health check:** Automatic every 30 seconds.

---

## ✨ All Features

**Dashboard:** Live counters (users, pullers, rides, reviews) updating every 5 seconds.  
**Map:** Real-time ride pins (red/yellow/blue/green) + moving driver markers.  
**Rides:** Filterable list, detailed view, GPS paths, cancel/reassign actions.  
**Users:** Point adjustment with audit trail, ban/suspend accounts.  
**Reviews:** Dispute queue, GPS evidence display, accept/deny with reasons.  
**Analytics:** Puller leaderboard, wait time charts, popular destinations.  
**Admin actions:** Force reassign, cancel rides, ban users, adjust points.

---

## 🔄 Real-time System

**Connection:** Socket.io WebSocket to backend.  
**Events:** `ride:new`, `ride:update`, `puller:location`, `user:points`, `review:new`.  
**Updates:** Auto-reconnect every 5 seconds if disconnected.  
**Mock mode:** Simulates events when `VITE_USE_MOCK_DATA=true`.  
**Status:** Green badge = connected, red = disconnected.

---

## 📦 Mock Data

**Purpose:** Test dashboard without backend.  
**Source:** `mockData.ts` with 50+ rides, 20+ users, 15+ pullers.  
**Enable:** Set `VITE_USE_MOCK_DATA=true` in `.env.local`.  
**Features:** Simulated WebSocket events, moving markers, status changes.  
**Switch:** Change to `false` and set `VITE_API_URL` for real backend.

---

## 🔐 Authentication

**Method:** JWT tokens stored in localStorage.  
**Login:** `admin@aeras.com` / `admin123` (mock mode).  
**Flow:** Login → Get token → Store → Include in API requests.  
**Protection:** Protected routes check token before rendering.  
**Logout:** Clears token, redirects to login.

---

## 🎨 UI/UX

**Responsive:** Mobile (<640px), Tablet (640-1024px), Desktop (>1024px).  
**Accessible:** WCAG 2.1 AA compliant, keyboard navigation, screen readers.  
**Colors:** Blue primary, red errors, green success, status colors for rides.  
**Buttons:** Minimum 44x44px for touch targets.  
**Icons:** Lucide React library.

---

## 🚀 Deployment

**Dev:** `npm run dev` → http://localhost:5173.  
**Build:** `npm run build` → `dist/` folder.  
**Docker:** `docker build -t aeras-dashboard .` → `docker run -p 8080:80`.  
**Cloud:** Deploy `dist/` to Vercel, Netlify, AWS S3, or Azure.

---

## 🔧 Environment Variables

**Required:**
- `VITE_API_URL` - Backend API endpoint
- `VITE_WS_URL` - WebSocket server URL
- `VITE_USE_MOCK_DATA` - Enable mock mode (true/false)

**Optional:**
- `VITE_MAPBOX_TOKEN` - Mapbox API key
- `VITE_DEFAULT_ADMIN_EMAIL` - Mock login email
- `VITE_DEFAULT_ADMIN_PASSWORD` - Mock login password

---

## 📊 Performance

**Bundle size:** ~500KB gzipped.  
**Load time:** <2 seconds on 3G.  
**Updates:** Every 5 seconds via WebSocket.  
**Code splitting:** Lazy-loaded pages reduce initial bundle.

---

## 🔒 Security

**Frontend:** Environment variables not exposed, XSS protection via React.  
**Auth:** JWT tokens, automatic expiration check.  
**API:** All requests include auth token.  
**CORS:** Configured on backend.

---

## 📱 Mobile

**Responsive:** Works on all screen sizes.  
**Touch:** Large buttons (44x44px), swipe gestures.  
**Access:** Connect phone to same WiFi, use PC's IP: `http://YOUR_IP:5173`.

---

## 🧪 Development

**Start:** `npm install` → `npm run dev`.  
**Build:** `npm run build` → `npm run preview`.  
**Structure:** Components, pages, services, contexts, types, mock folders.  
**Hot reload:** Automatic on code changes.

---

## 📚 Documentation

- `SYSTEM_OVERVIEW.md` - Complete system documentation
- `README.md` - Full project guide
- `QUICK_START.md` - 5-minute setup
- `BACKEND_INTEGRATION.md` - API specs
- `ARCHITECTURE.md` - Technical details

---

## ✅ Quick Commands

```bash
# Development
npm install
npm run dev

# Production
npm run build
npm run preview

# Docker
docker build -t aeras-dashboard .
docker run -p 8080:80 aeras-dashboard

# Check server
Get-Process node
```

---

## 🎯 Key Points

- **Real-time:** WebSocket updates every 5 seconds
- **Maps:** Mapbox with OpenStreetMap fallback
- **Docker:** Multi-stage build, ~50MB image
- **Mock data:** Works without backend
- **Responsive:** Mobile, tablet, desktop
- **Accessible:** WCAG 2.1 AA compliant
- **Complete:** All admin features implemented

---

*For detailed information, see SYSTEM_OVERVIEW.md*


