import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RideDetail from './pages/RideDetail'
import Points from './pages/Points'
import Settings from './pages/Settings'
import RideNotificationModal from './components/RideNotificationModal'
import NotificationBanner from './components/NotificationBanner'
import LoadingOverlay from './components/LoadingOverlay'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { initialize, isAuthenticated, isLoading, error, clearError, connectionStatus } = useAppStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      useAppStore.getState().setOnlineStatus(true)
    }
    const handleOffline = () => {
      useAppStore.getState().setOnlineStatus(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <NotificationBanner />
        <LoadingOverlay show={isLoading} />
        
        {error && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/ride/:rideId"
            element={
              isAuthenticated ? <RideDetail /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/points"
            element={
              isAuthenticated ? <Points /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? <Settings /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <RideNotificationModal />
      </div>
    </ErrorBoundary>
  )
}

export default App

