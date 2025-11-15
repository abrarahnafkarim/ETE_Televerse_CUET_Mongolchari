import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Map from '../components/Map'
import gps from '../services/gps'

export default function RideDetail() {
  const { rideId } = useParams()
  const navigate = useNavigate()
  const {
    currentRide,
    currentLocation,
    confirmPickup,
    confirmDropoff,
    cancelRide,
    isLoading,
    error,
  } = useAppStore()

  const [routeInfo, setRouteInfo] = useState(null)
  const [distanceToPickup, setDistanceToPickup] = useState(null)
  const [distanceToDestination, setDistanceToDestination] = useState(null)
  const [canConfirmPickup, setCanConfirmPickup] = useState(false)
  const [canConfirmDropoff, setCanConfirmDropoff] = useState(false)
  const [isAtPickup, setIsAtPickup] = useState(false)
  const [isAtDestination, setIsAtDestination] = useState(false)

  useEffect(() => {
    if (!currentRide || currentRide.ride_id !== rideId) {
      // Try to load ride from storage or navigate back
      navigate('/dashboard')
      return
    }

    // Start GPS tracking if not already started
    if (!gps.isTracking) {
      gps.startTracking((location) => {
        if (location) {
          calculateDistances(location)
        }
      })
    }

    // Calculate initial distances
    if (currentLocation) {
      calculateDistances(currentLocation)
    }
  }, [rideId, currentRide, currentLocation, navigate])

  const calculateDistances = (location) => {
    if (!location || !currentRide) return

    // Distance to pickup
    if (currentRide.pickup_location) {
      const distance = gps.calculateDistance(
        location.latitude,
        location.longitude,
        currentRide.pickup_location.latitude,
        currentRide.pickup_location.longitude
      )
      setDistanceToPickup(distance)

      // Check if within pickup radius (20-50m)
      if (distance <= 50 && distance >= 20) {
        setCanConfirmPickup(true)
        setIsAtPickup(true)
      } else if (distance < 20) {
        setCanConfirmPickup(true)
        setIsAtPickup(true)
      } else {
        setCanConfirmPickup(false)
        setIsAtPickup(false)
      }
    }

    // Distance to destination
    if (currentRide.destination_location) {
      const distance = gps.calculateDistance(
        location.latitude,
        location.longitude,
        currentRide.destination_location.latitude,
        currentRide.destination_location.longitude
      )
      setDistanceToDestination(distance)

      // Check if within destination radius (±50m)
      if (distance <= 50) {
        setCanConfirmDropoff(true)
        setIsAtDestination(true)
      } else {
        setCanConfirmDropoff(false)
        setIsAtDestination(false)
      }
    }
  }

  const handleConfirmPickup = async () => {
    if (!currentLocation || !canConfirmPickup) return

    try {
      await confirmPickup(currentRide.ride_id, currentLocation.latitude, currentLocation.longitude)
    } catch (error) {
      console.error('Confirm pickup error:', error)
    }
  }

  const handleConfirmDropoff = async () => {
    if (!currentLocation || !canConfirmDropoff) return

    try {
      await confirmDropoff(currentRide.ride_id, currentLocation.latitude, currentLocation.longitude)
      // Navigate back to dashboard after dropoff
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Confirm dropoff error:', error)
    }
  }

  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return

    try {
      await cancelRide(currentRide.ride_id, 'Driver cancelled')
      navigate('/dashboard')
    } catch (error) {
      console.error('Cancel ride error:', error)
    }
  }

  const handleRouteReady = (info) => {
    setRouteInfo(info)
  }

  const handleArrival = (type, distance) => {
    if (type === 'pickup' && distance <= 50) {
      setCanConfirmPickup(true)
      setIsAtPickup(true)
    } else if (type === 'destination' && distance <= 50) {
      setCanConfirmDropoff(true)
      setIsAtDestination(true)
    }
  }

  const formatDistance = (meters) => {
    if (meters === null || meters === undefined) return '--'
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '--'
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (!currentRide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    )
  }

  const isPickupConfirmed = currentRide.status === 'picked_up' || currentRide.status === 'in_progress'
  const isDropoffConfirmed = currentRide.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">Ride Details</h1>
          <button
            onClick={handleCancelRide}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Cancel
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              currentRide.status === 'accepted'
                ? 'bg-yellow-100 text-yellow-800'
                : currentRide.status === 'picked_up'
                ? 'bg-blue-100 text-blue-800'
                : currentRide.status === 'completed'
                ? 'bg-success-100 text-success-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {currentRide.status === 'accepted' && 'Going to Pickup'}
            {currentRide.status === 'picked_up' && 'In Progress'}
            {currentRide.status === 'completed' && 'Completed'}
            {!['accepted', 'picked_up', 'completed'].includes(currentRide.status) && currentRide.status}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[400px]">
        <Map
          pickupLocation={currentRide.pickup_location}
          destinationLocation={currentRide.destination_location}
          currentLocation={currentLocation}
          onRouteReady={handleRouteReady}
          onArrival={handleArrival}
          pickupRadius={50}
          destinationRadius={50}
        />
      </div>

      {/* Ride Info Card */}
      <div className="bg-white border-t shadow-lg">
        <div className="px-4 py-4 space-y-4">
          {/* Location Details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Pickup</p>
              <p className="text-sm font-medium text-gray-900">
                {currentRide.pickup_address || 'Pickup Location'}
              </p>
              {!isPickupConfirmed && distanceToPickup !== null && (
                <p className="text-xs text-primary-600 mt-1">
                  {formatDistance(distanceToPickup)} away
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Destination</p>
              <p className="text-sm font-medium text-gray-900">
                {currentRide.destination_address || 'Destination'}
              </p>
              {isPickupConfirmed && distanceToDestination !== null && (
                <p className="text-xs text-primary-600 mt-1">
                  {formatDistance(distanceToDestination)} away
                </p>
              )}
          </div>
          </div>

          {/* Route Info */}
          {routeInfo && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-xs text-gray-600">Distance</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDistance(routeInfo.distance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">ETA</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDuration(routeInfo.duration)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fare</p>
                <p className="text-sm font-medium text-success-600">
                  ৳{currentRide.fare || 0}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            {!isPickupConfirmed && (
              <button
                onClick={handleConfirmPickup}
                disabled={!canConfirmPickup || isLoading}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  canConfirmPickup && !isLoading
                    ? 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Confirming...' : isAtPickup ? 'Confirm Pickup' : `Move closer to pickup (${formatDistance(distanceToPickup)})`}
              </button>
            )}

            {isPickupConfirmed && !isDropoffConfirmed && (
              <div className="space-y-2">
                {isAtPickup && (
                  <div className="bg-success-50 border border-success-200 text-success-800 px-4 py-2 rounded-lg text-sm text-center">
                    ✓ Accepted – User will see Yellow LED
                  </div>
                )}
                <button
                  onClick={handleConfirmDropoff}
                  disabled={!canConfirmDropoff || isLoading}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    canConfirmDropoff && !isLoading
                      ? 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading
                    ? 'Confirming...'
                    : isAtDestination
                    ? 'Confirm Drop-off'
                    : `Move closer to destination (${formatDistance(distanceToDestination)})`}
                </button>
              </div>
            )}

            {isDropoffConfirmed && (
              <div className="bg-success-50 border border-success-200 text-success-800 px-4 py-3 rounded-lg text-center">
                <p className="font-medium">✓ Ride Completed!</p>
                <p className="text-xs mt-1">
                  {currentRide.points_awarded
                    ? `+${currentRide.points_awarded} points awarded`
                    : 'Points will be updated shortly'}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

