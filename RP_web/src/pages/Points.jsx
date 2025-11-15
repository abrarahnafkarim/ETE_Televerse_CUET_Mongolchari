import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { formatDistanceToNow, format } from 'date-fns'

export default function Points() {
  const navigate = useNavigate()
  const {
    pointsBalance,
    rideHistory,
    pendingVerifications,
    loadPointsBalance,
    loadRideHistory,
    loadPendingVerifications,
  } = useAppStore()

  useEffect(() => {
    loadPointsBalance()
    loadRideHistory()
    loadPendingVerifications()
  }, [loadPointsBalance, loadRideHistory, loadPendingVerifications])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return dateString
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">Points & History</h1>
          <div className="w-12"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Points Balance Card */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-success-500 to-success-600 rounded-lg p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Points Balance</p>
          <p className="text-4xl font-bold">{pointsBalance}</p>
          <p className="text-xs opacity-75 mt-2">Keep riding to earn more!</p>
        </div>
      </div>

      {/* Pending Verifications */}
      {pendingVerifications.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Pending Verifications</h2>
          <div className="space-y-2">
            {pendingVerifications.map((verification) => (
              <div
                key={verification.id}
                className="bg-warning-50 border border-warning-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Ride #{verification.ride_id}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {verification.pickup_address || 'Pickup'} →{' '}
                      {verification.destination_address || 'Destination'}
                    </p>
                    <p className="text-xs text-warning-700 mt-1">
                      Awaiting drop-off verification
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-warning-100 text-warning-800 rounded text-xs font-medium">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ride History */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Ride History (Last 10)</h2>
        
        {rideHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-2">No ride history yet</p>
            <p className="text-sm text-gray-500">Your completed rides will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rideHistory.map((ride) => (
              <div
                key={ride.ride_id}
                className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                  ride.status === 'completed'
                    ? 'border-success-500'
                    : ride.status === 'pending'
                    ? 'border-warning-500'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {ride.pickup_address || 'Pickup'}
                      </p>
                      <span className="text-gray-400">→</span>
                      <p className="text-sm font-medium text-gray-900">
                        {ride.destination_address || 'Destination'}
                      </p>
                    </div>
                    {ride.completed_at && (
                      <p className="text-xs text-gray-500">
                        {formatDate(ride.completed_at)} ({formatTimeAgo(ride.completed_at)})
                      </p>
                    )}
                  </div>
                  {ride.points_awarded && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-success-600">
                        +{ride.points_awarded}
                      </p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Fare</p>
                      <p className="text-xs font-medium text-gray-900">৳{ride.fare || 0}</p>
                    </div>
                    {ride.distance && (
                      <div>
                        <p className="text-xs text-gray-600">Distance</p>
                        <p className="text-xs font-medium text-gray-900">
                          {ride.distance < 1000
                            ? `${Math.round(ride.distance)}m`
                            : `${(ride.distance / 1000).toFixed(1)}km`}
                        </p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
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
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate('/points')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-primary-600"
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

