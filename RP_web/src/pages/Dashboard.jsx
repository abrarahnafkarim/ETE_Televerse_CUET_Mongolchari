import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { formatDistanceToNow } from 'date-fns'

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    driver,
    currentRide,
    pointsBalance,
    currentLocation,
    isLocationEnabled,
    connectionStatus,
    loadPointsBalance,
    loadRideHistory,
    rideHistory,
    logout,
  } = useAppStore()

  useEffect(() => {
    loadPointsBalance()
    loadRideHistory()
  }, [loadPointsBalance, loadRideHistory])

  const handleStartRide = (rideId) => {
    navigate(`/ride/${rideId}`)
  }

  const formatDistance = (meters) => {
    if (!meters) return 'N/A'
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome, {driver?.name || 'Driver'}
              </h1>
              <p className="text-sm text-gray-600">Driver ID: {driver?.id}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-success-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-600">
                {connectionStatus === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isLocationEnabled ? 'bg-success-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-600">
                {isLocationEnabled ? 'GPS Active' : 'GPS Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Points Balance Card */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Points</p>
          <p className="text-4xl font-bold">{pointsBalance}</p>
          <button
            onClick={() => navigate('/points')}
            className="mt-4 text-sm underline opacity-90 hover:opacity-100"
          >
            View History →
          </button>
        </div>
      </div>

      {/* Current Ride Card */}
      {currentRide && (
        <div className="px-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-warning-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Active Ride</h2>
              <span className="px-3 py-1 bg-warning-100 text-warning-800 rounded-full text-xs font-medium">
                {currentRide.status === 'accepted' ? 'Going to Pickup' : 
                 currentRide.status === 'picked_up' ? 'In Progress' : 
                 currentRide.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <p className="text-xs text-gray-600">Pickup</p>
                <p className="text-sm font-medium text-gray-900">
                  {currentRide.pickup_address || 'Pickup Location'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Destination</p>
                <p className="text-sm font-medium text-gray-900">
                  {currentRide.destination_address || 'Destination'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleStartRide(currentRide.ride_id)}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800"
            >
              Continue Ride
            </button>
          </div>
        </div>
      )}

      {/* Recent Rides */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Rides</h2>
        
        {rideHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No rides yet</p>
            <p className="text-sm text-gray-500 mt-2">Your ride history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rideHistory.slice(0, 5).map((ride) => (
              <div
                key={ride.ride_id}
                className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-success-500"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {ride.pickup_address || 'Pickup'} → {ride.destination_address || 'Destination'}
                    </p>
                    {ride.completed_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(ride.completed_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  {ride.points_awarded && (
                    <span className="text-sm font-bold text-success-600">
                      +{ride.points_awarded} pts
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <span className="text-xs text-gray-600">Fare: ৳{ride.fare || 0}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      ride.status === 'completed'
                        ? 'bg-success-100 text-success-800'
                        : ride.status === 'pending'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around px-4 py-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-primary-600"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate('/points')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl">💰</span>
            <span className="text-xs font-medium">Points</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

