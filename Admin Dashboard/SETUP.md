# AERAS Admin Dashboard - Complete Setup Guide

This guide will walk you through setting up the AERAS Admin Dashboard from scratch.

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- (Optional) **Docker** and Docker Compose for containerized deployment
- (Optional) **Mapbox API Token** for map features ([Get free token](https://account.mapbox.com/))
- Basic knowledge of React and TypeScript

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Navigate to project directory
cd "Admin Dashboard"

# Install all dependencies
npm install
```

### 2. Configure Environment

The project includes a `.env` file with development defaults:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=
VITE_USE_MOCK_DATA=true
```

**For immediate testing**: No changes needed! The dashboard will use mock data.

**For Mapbox maps**: Add your token to `VITE_MAPBOX_TOKEN=your_token_here`

### 3. Start Development Server

```bash
npm run dev
```

The dashboard will open at: **http://localhost:3000**

### 4. Login

Use the default credentials:
- **Email**: `admin@aeras.com`
- **Password**: `admin123`

**That's it!** 🎉 You now have a fully functional dashboard with mock data.

## 🔧 Detailed Setup Options

### Option A: Mock Data Mode (Development)

Perfect for development, testing, and demonstrations without a backend.

**Configuration:**
```env
VITE_USE_MOCK_DATA=true
```

**Features:**
- ✅ Pre-loaded sample data
- ✅ Simulated real-time updates
- ✅ All features functional
- ✅ No backend required

### Option B: Backend Integration (Production)

Connect to your real AERAS backend server.

**Configuration:**
```env
VITE_API_URL=http://your-backend-url:8000
VITE_WS_URL=http://your-backend-url:8000
VITE_USE_MOCK_DATA=false
```

**Requirements:**
- Backend server must be running
- API endpoints must match specification (see `BACKEND_INTEGRATION.md`)
- CORS must be configured on backend
- WebSocket server must be available

**Testing Connection:**
```bash
# Test if backend is accessible
curl http://localhost:8000/api/admin/stats

# Expected response: {"success":true,"data":{...}}
```

### Option C: Docker Deployment

Deploy the dashboard as a containerized application.

#### Build and Run

```bash
# Build Docker image
docker build -t aeras-admin \
  --build-arg VITE_API_URL=http://your-api:8000 \
  --build-arg VITE_MAPBOX_TOKEN=your_token \
  .

# Run container
docker run -p 3000:80 aeras-admin
```

#### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access at: **http://localhost:3000**

## 🗺️ Mapbox Setup (Optional but Recommended)

### 1. Create Mapbox Account

Visit: https://account.mapbox.com/

### 2. Generate Token

1. Go to "Access tokens" page
2. Click "Create a token"
3. Name it "AERAS Admin Dashboard"
4. Select scopes:
   - ✅ `styles:read`
   - ✅ `fonts:read`
   - ✅ `datasets:read`
5. Copy the token

### 3. Add Token to Environment

```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscXl6...
```

### 4. Restart Server

```bash
npm run dev
```

**Alternative**: If you don't have a Mapbox token, the dashboard will fall back to OpenStreetMap tiles.

## 📱 Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev

# Type check without building
npm run type-check

# Lint code
npm run lint
```

### Production

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Docker

```bash
# Build image
docker build -t aeras-admin .

# Run container
docker run -p 3000:80 aeras-admin

# With Docker Compose
docker-compose up -d
```

## 🎯 Feature Verification Checklist

After setup, verify these features work:

### ✅ Authentication
- [ ] Login with credentials
- [ ] JWT token stored in localStorage
- [ ] Logout clears session
- [ ] Protected routes redirect to login

### ✅ Dashboard
- [ ] Live counters display
- [ ] Stats update in real-time
- [ ] Quick action links work
- [ ] System status shows connection state

### ✅ Map View
- [ ] Map renders correctly
- [ ] Ride markers appear
- [ ] Puller markers appear
- [ ] Click markers shows details
- [ ] Map controls work (zoom, pan)

### ✅ Ride Management
- [ ] List displays rides
- [ ] Filters work
- [ ] Search works
- [ ] View ride details
- [ ] Cancel ride (with mock data)

### ✅ User Management
- [ ] List displays users
- [ ] Search works
- [ ] Point adjustment modal opens
- [ ] Point history displays
- [ ] Ban/Suspend modals work

### ✅ Reviews
- [ ] Pending reviews display
- [ ] Filter tabs work
- [ ] Approve/Reject modals open
- [ ] Actions complete successfully

### ✅ Analytics
- [ ] Charts render
- [ ] Leaderboard displays
- [ ] Popular destinations show

## 🔍 Troubleshooting

### Problem: Dependencies won't install

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000 (Unix/Mac)
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Problem: Map not displaying

**Possible causes:**
1. Missing Mapbox token
2. Invalid token
3. Token lacks required permissions

**Solution:**
- Check token is set in `.env`
- Verify token at https://account.mapbox.com/
- Dashboard will fall back to OpenStreetMap if token missing

### Problem: Real-time updates not working

**Checklist:**
- [ ] WebSocket URL is correct
- [ ] Backend WebSocket server is running
- [ ] CORS configured on backend
- [ ] Check browser console for errors
- [ ] Try mock mode: `VITE_USE_MOCK_DATA=true`

### Problem: Login fails

**Mock mode:**
- Use exactly: `admin@aeras.com` / `admin123`
- Check `.env` has `VITE_USE_MOCK_DATA=true`

**Backend mode:**
- Verify backend is running
- Check API URL is correct
- Test backend: `curl http://localhost:8000/api/admin/login -X POST`

### Problem: Build errors

**Solution:**
```bash
# Check Node version (must be 18+)
node --version

# Update Node if needed
nvm install 18
nvm use 18

# Clear and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## 🌐 Production Deployment

### Step 1: Build Production Bundle

```bash
npm run build
```

This creates optimized files in `dist/` directory.

### Step 2: Deploy Static Files

Upload `dist/` contents to:
- **Netlify**: Drag & drop `dist` folder
- **Vercel**: Import GitHub repo
- **AWS S3**: Upload to bucket + CloudFront
- **Nginx**: Copy to `/var/www/html`

### Step 3: Configure Environment Variables

Set production values:
```env
VITE_API_URL=https://api.aeras.com
VITE_WS_URL=https://api.aeras.com
VITE_MAPBOX_TOKEN=pk.production_token...
VITE_USE_MOCK_DATA=false
```

### Step 4: Test Production Build

```bash
npm run preview
```

### Step 5: Update Admin Credentials

⚠️ **Important**: Change default admin credentials in production!

## 📊 Sample Data

The project includes sample data in `sample-data/`:

- `rides.json` - Sample ride data
- `users.csv` - Sample user data

Use these for:
- Testing integrations
- Understanding data structure
- Seeding backend database

## 🔐 Security Checklist

Before production deployment:

- [ ] Change default admin credentials
- [ ] Set strong JWT secret on backend
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers (CSP, HSTS, etc.)
- [ ] Review and remove console.log statements
- [ ] Set secure cookie flags
- [ ] Implement audit logging

## 📚 Next Steps

1. **Read Documentation**
   - `README.md` - Overview and features
   - `ARCHITECTURE.md` - Technical architecture
   - `BACKEND_INTEGRATION.md` - API integration guide
   - `ACCESSIBILITY.md` - Accessibility features

2. **Customize Dashboard**
   - Update branding in `Sidebar.tsx`
   - Modify colors in `tailwind.config.js`
   - Add custom features

3. **Connect to Backend**
   - Review API specification
   - Implement backend endpoints
   - Test integration

4. **Deploy to Production**
   - Build production bundle
   - Deploy to hosting
   - Configure environment
   - Test thoroughly

## 🆘 Getting Help

### Documentation
- Check `README.md` for features
- Check `BACKEND_INTEGRATION.md` for API details
- Check `ARCHITECTURE.md` for technical details

### Debugging
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify environment variables
4. Test with mock data mode first

### Common Questions

**Q: Can I use Google Maps instead of Mapbox?**
A: Yes, but you'll need to modify `MapView.tsx` to use Google Maps React library.

**Q: How do I add new admin users?**
A: Admin users are managed by the backend. Implement user management in your backend API.

**Q: Can I customize the dashboard theme?**
A: Yes! Edit `tailwind.config.js` for colors and `src/index.css` for global styles.

**Q: Is this production-ready?**
A: The frontend is production-ready. Ensure your backend implements proper security, authentication, and validation.

## ✅ Setup Complete!

You now have a fully functional AERAS Admin Dashboard. Enjoy monitoring and managing your ride-sharing platform! 🚀

For questions or issues, refer to the documentation or contact the development team.

