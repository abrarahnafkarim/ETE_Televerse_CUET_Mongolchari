# AERAS Admin Dashboard

A comprehensive, real-time admin dashboard for the AERAS ride-sharing platform. Built with React, TypeScript, and modern web technologies.

## 🚀 Features

### Core Functionality
- **Real-time Monitoring**: WebSocket integration for live updates
- **Interactive Map**: Mapbox-powered map showing live ride requests and driver locations
- **Ride Management**: Complete ride lifecycle tracking with filters and detailed views
- **User Management**: Manage users and pullers with ban/suspend capabilities
- **Point System**: Manual point adjustments with full audit trail
- **Review Queue**: Handle GPS disputes and behavior reports
- **Analytics Dashboard**: Leaderboard, charts, and performance metrics

### Technical Features
- ✅ JWT Authentication
- ✅ Protected Routes
- ✅ Real-time WebSocket Updates
- ✅ Mock Data Mode for Development
- ✅ Responsive Design
- ✅ Accessibility Compliant (WCAG 2.1 AA)
- ✅ Docker Support
- ✅ TypeScript for Type Safety

## 📋 Prerequisites

- Node.js 18+ and npm
- (Optional) Docker for containerized deployment
- (Optional) Mapbox API token for map features

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd admin-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
# Backend API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8000

# Mapbox Configuration (get free token at https://account.mapbox.com/)
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# Mock Data Mode (set to 'true' to use mock data)
VITE_USE_MOCK_DATA=true

# Default Admin Credentials (for development)
VITE_DEFAULT_ADMIN_EMAIL=admin@aeras.com
VITE_DEFAULT_ADMIN_PASSWORD=admin123
```

### 4. Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t aeras-admin \
  --build-arg VITE_API_URL=http://your-api-url:8000 \
  --build-arg VITE_MAPBOX_TOKEN=your_mapbox_token \
  .
```

### Run Container

```bash
docker run -p 3000:80 aeras-admin
```

### Using Docker Compose

```bash
docker-compose up -d
```

## 🔑 Default Login Credentials

**Email**: `admin@aeras.com`  
**Password**: `admin123`

> ⚠️ Change these credentials in production!

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Buttons, Inputs, Cards, etc.
│   │   └── Layout/         # Sidebar, Header, MainLayout
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── RealtimeContext.tsx
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── MapView.tsx
│   │   ├── Rides.tsx
│   │   ├── Users.tsx
│   │   ├── Reviews.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── services/           # API and WebSocket services
│   │   ├── api.ts
│   │   ├── mockApi.ts
│   │   └── websocket.ts
│   ├── mock/               # Mock data for testing
│   │   └── mockData.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── nginx.conf             # Nginx configuration for production
└── README.md              # This file
```

## 🔗 Backend Integration

### API Endpoints Expected

The dashboard expects the following API endpoints:

#### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `POST /api/admin/refresh` - Refresh JWT token

#### Dashboard
- `GET /api/admin/stats` - Get dashboard statistics

#### Rides
- `GET /api/admin/rides` - List rides (with filters)
- `GET /api/admin/rides/:id` - Get ride details
- `POST /api/admin/rides/:id/cancel` - Cancel a ride
- `POST /api/admin/rides/:id/reassign` - Reassign ride to different puller

#### Users
- `GET /api/admin/users` - List users (with filters)
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `POST /api/admin/users/:id/adjust-points` - Adjust user points

#### Reviews
- `GET /api/admin/reviews` - List reviews
- `POST /api/admin/reviews/:id/approve` - Approve review
- `POST /api/admin/reviews/:id/reject` - Reject review

#### Analytics
- `GET /api/admin/analytics/leaderboard` - Get puller leaderboard
- `GET /api/admin/analytics/destinations` - Get popular destinations
- `GET /api/admin/analytics/timeseries` - Get time series data

### WebSocket Events

The dashboard listens for the following WebSocket events:

- `ride_update` - Real-time ride status updates
- `puller_location` - Real-time puller location updates
- `stats_update` - Dashboard statistics updates
- `review_created` - New review notifications
- `user_status` - User status changes

### Mock Data Mode

When `VITE_USE_MOCK_DATA=true`, the dashboard uses built-in mock data instead of making real API calls. This is useful for:
- Development without backend
- Testing UI components
- Demonstrations

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Touch-friendly buttons (minimum 44x44px)

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus indicators on all interactive elements
- Semantic HTML
- ARIA labels where needed

### Color Coding
- **Red**: Waiting rides, danger actions, errors
- **Yellow/Orange**: Matched rides, warnings
- **Blue**: In-transit rides, info messages
- **Green**: Completed rides, success states, online status
- **Gray**: Cancelled rides, offline status

## 📊 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🔧 Configuration Options

### Map Provider

The dashboard uses Mapbox by default but falls back to OpenStreetMap if no token is provided.

To use Google Maps instead:
1. Get API key from Google Cloud Console
2. Update `MapView.tsx` to use Google Maps React library
3. Set `VITE_GOOGLE_MAPS_KEY` environment variable

### Customization

- **Colors**: Edit `tailwind.config.js` to change color scheme
- **Logo**: Replace logo in `Sidebar.tsx`
- **Branding**: Update text in layout components

## 🐛 Troubleshooting

### Map Not Displaying
- Ensure `VITE_MAPBOX_TOKEN` is set correctly
- Check browser console for errors
- Verify Mapbox token has necessary permissions

### WebSocket Not Connecting
- Verify `VITE_WS_URL` is correct
- Check if backend WebSocket server is running
- Enable mock mode to bypass WebSocket: `VITE_USE_MOCK_DATA=true`

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check Node.js version (18+ required)

## 📄 License

This project is proprietary software for AERAS platform.

## 👥 Support

For issues, questions, or contributions, contact the development team.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Real-time dashboard with WebSocket
- Map integration with Mapbox
- Complete CRUD operations for rides, users, reviews
- Point adjustment system
- Analytics and leaderboard
- Docker support
- Mock data mode

