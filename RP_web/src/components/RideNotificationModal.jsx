import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function RideNotificationModal() {
  const navigate = useNavigate()
  const {
    showRideModal,
    rideOffers,
    activeNotification,
    acceptRide,
    rejectRide,
    setShowRideModal,
  } = useAppStore()

  const [acceptTimeout, setAcceptTimeout] = useState(30) // 30 second timeout

  useEffect(() => {
    if (!showRideModal || !activeNotification) return

    // Reset timeout
    setAcceptTimeout(30)

    // Start countdown
    const interval = setInterval(() => {
      setAcceptTimeout((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Auto-reject if timeout
          handleReject()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showRideModal, activeNotification])

  if (!showRideModal || !activeNotification) return null

  const offer = activeNotification

  const handleAccept = async () => {
    try {
      await acceptRide(offer.ride_id)
      navigate(`/ride/${offer.ride_id}`)
    } catch (error) {
      console.error('Accept ride error:', error)
    }
  }

  const handleReject = async () => {
    try {
      await rejectRide(offer.ride_id)
      if (rideOffers.length <= 1) {
        setShowRideModal(false)
      }
    } catch (error) {
      console.error('Reject ride error:', error)
    }
  }

  const formatDistance = (meters) => {
    if (!meters) return 'N/A'
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatPrice = (amount) => {
    return `৳${amount || 0}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-pulse-ring">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">🚗 New Ride Request</h2>
            <span className="text-sm font-medium text-primary-600">
              {acceptTimeout}s
            </span>
          </div>
          {rideOffers.length > 1 && (
            <p className="text-sm text-gray-600">
              {rideOffers.length} ride offers available
            </p>
          )}
        </div>

        {/* Ride Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Pickup</p>
              <p className="font-medium text-gray-900">{offer.pickup_address || 'Pickup Location'}</p>
            </div>
            {offer.distance !== null && (
              <span className="text-sm font-medium text-primary-600 whitespace-nowrap ml-4">
                {formatDistance(offer.distance)}
              </span>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">Destination</p>
            <p className="font-medium text-gray-900">{offer.destination_address || 'Destination'}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-600">Fare</span>
            <span className="text-lg font-bold text-success-600">
              {formatPrice(offer.fare)}
            </span>
          </div>

          {offer.estimated_duration && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimated Time</span>
              <span className="text-sm font-medium text-gray-900">
                {offer.estimated_duration} min
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 active:bg-gray-400 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 active:bg-success-800 transition-colors"
          >
            Accept
          </button>
        </div>

        {/* Auto-expiry notice */}
        {acceptTimeout <= 10 && (
          <p className="text-xs text-red-600 text-center mt-3">
            Auto-rejecting in {acceptTimeout} seconds...
          </p>
        )}
      </div>
    </div>
  )
}

