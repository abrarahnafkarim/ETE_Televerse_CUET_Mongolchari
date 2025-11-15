# AERAS Admin Dashboard - Quick Start Guide

Get up and running in **5 minutes**! ⚡

## ⚡ Super Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser to http://localhost:3000

# 4. Login with:
#    Email: admin@aeras.com
#    Password: admin123
```

**That's it!** The dashboard will run with mock data by default.

## 🎯 What You Get Out of the Box

✅ Fully functional admin dashboard
✅ Real-time mock data updates
✅ All features working (map, rides, users, reviews, analytics)
✅ No backend required
✅ Interactive map (OpenStreetMap fallback)

## 🗺️ Optional: Add Mapbox (Better Maps)

1. Get free token: https://account.mapbox.com/
2. Open `.env` file
3. Add your token:
   ```env
   VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIi...
   ```
4. Restart server: `npm run dev`

## 🔌 Connect to Real Backend

1. Open `.env` file
2. Update these lines:
   ```env
   VITE_API_URL=http://your-backend:8000
   VITE_USE_MOCK_DATA=false
   ```
3. Restart server

**Requirements:**
- Backend must implement API spec (see `BACKEND_INTEGRATION.md`)
- Backend must be running and accessible
- CORS must allow your frontend domain

## 🐳 Quick Docker Deploy

```bash
# Build image
docker build -t aeras-admin .

# Run container
docker run -p 3000:80 aeras-admin

# Access at http://localhost:3000
```

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `.env` | Configuration (API URL, tokens, mock mode) |
| `src/pages/` | All dashboard pages |
| `src/mock/mockData.ts` | Sample data |
| `README.md` | Full documentation |
| `SETUP.md` | Detailed setup guide |

## 🎨 Key Features to Try

### 1. Dashboard
- View live statistics
- Real-time counter updates
- System status

### 2. Map View
- See ride markers (red = waiting, blue = in-transit)
- See driver markers (green = online, yellow = busy)
- Click markers for details

### 3. Ride Management
- Search and filter rides
- View ride details with GPS path
- Cancel rides

### 4. User Management
- Search users
- Adjust user points (with audit trail)
- View point history
- Suspend or ban users

### 5. Review Queue
- Handle pending disputes
- Approve or reject with reasons
- View evidence

### 6. Analytics
- View charts and graphs
- Check leaderboard
- See popular destinations

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run type-check       # Check TypeScript
npm run lint            # Lint code

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Docker
docker-compose up -d    # Start with Docker Compose
docker-compose logs -f  # View logs
docker-compose down     # Stop services
```

## 🐛 Quick Troubleshooting

### Problem: Port 3000 in use
```bash
# Kill process (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Use different port
PORT=3001 npm run dev
```

### Problem: Dependencies won't install
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Map not showing
- Add Mapbox token to `.env`
- Or use OpenStreetMap fallback (works without token)

### Problem: Can't login
- Use exact credentials: `admin@aeras.com` / `admin123`
- Check `.env` has `VITE_USE_MOCK_DATA=true`

## 📚 Need More Help?

- **Setup Issues?** → See `SETUP.md`
- **Backend Integration?** → See `BACKEND_INTEGRATION.md`
- **Architecture?** → See `ARCHITECTURE.md`
- **Components?** → See `COMPONENT_LIST.md`
- **Accessibility?** → See `ACCESSIBILITY.md`

## 🎯 Next Steps

1. ✅ **Explore the Dashboard**
   - Login and click around
   - Try all features
   - Check responsiveness (resize browser)

2. ✅ **Customize**
   - Update branding in `Sidebar.tsx`
   - Change colors in `tailwind.config.js`
   - Modify mock data in `src/mock/mockData.ts`

3. ✅ **Integrate Backend**
   - Read `BACKEND_INTEGRATION.md`
   - Implement backend endpoints
   - Test connection

4. ✅ **Deploy**
   - Build production bundle: `npm run build`
   - Deploy to hosting (Netlify, Vercel, AWS, etc.)
   - Configure production environment variables

## 🚀 Production Checklist

Before deploying to production:

- [ ] Build succeeds: `npm run build`
- [ ] Change admin credentials
- [ ] Set production API URL
- [ ] Add Mapbox token
- [ ] Set `VITE_USE_MOCK_DATA=false`
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Configure HTTPS
- [ ] Set up monitoring/logging

## 💡 Pro Tips

1. **Development with Backend**: Run backend on port 8000, frontend on 3000
2. **Testing**: Use mock mode first to verify features work
3. **Debugging**: Open browser console (F12) to see logs
4. **Hot Reload**: Save files and see changes instantly
5. **TypeScript**: Let your IDE show you type errors as you code

## 📞 Support

- Check documentation files for detailed info
- Review inline code comments
- Check browser console for error messages
- Verify environment variables are correct

---

## 🎉 You're Ready!

That's everything you need to get started. The dashboard is fully functional out of the box with mock data.

**Happy coding!** 🚀

---

**Quick Links:**
- [README.md](README.md) - Main documentation
- [SETUP.md](SETUP.md) - Detailed setup
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) - API specs
- [COMPONENT_LIST.md](COMPONENT_LIST.md) - Component reference
- [ACCESSIBILITY.md](ACCESSIBILITY.md) - Accessibility guide
- [DELIVERABLES.md](DELIVERABLES.md) - Complete checklist

