import { config } from '../config'
import api from './api'
import storage from './storage'

/**
 * GPS Service for location tracking
 */
class GpsService {
  constructor() {
    this.watchId = null
    this.currentPosition = null
    this.isTracking = false
    this.updateInterval = null
    this.onLocationUpdate = null
    this.lastSentLocation = null
  }

  async startTracking(onLocationUpdate = null) {
    if (this.isTracking) {
      return
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    this.onLocationUpdate = onLocationUpdate
    this.isTracking = true

    // Get initial position
    this.getCurrentPosition()

    // Watch position continuously
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.handlePositionUpdate(position)
      },
      (error) => {
        this.handlePositionError(error)
      },
      {
        enableHighAccuracy: config.gps.enableHighAccuracy,
        timeout: config.gps.timeout,
        maximumAge: config.gps.maximumAge,
      }
    )

    // Periodic updates to backend
    this.updateInterval = setInterval(() => {
      this.sendLocationToBackend()
    }, config.gps.updateInterval)
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.isTracking = false
    this.onLocationUpdate = null
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handlePositionUpdate(position)
          resolve(position)
        },
        reject,
        {
          enableHighAccuracy: config.gps.enableHighAccuracy,
          timeout: config.gps.timeout,
          maximumAge: config.gps.maximumAge,
        }
      )
    })
  }

  handlePositionUpdate(position) {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    }

    this.currentPosition = location
    storage.saveLastLocation(location)

    if (this.onLocationUpdate) {
      this.onLocationUpdate(location)
    }
  }

  handlePositionError(error) {
    let message = 'Unknown error occurred'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied'
        break
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable'
        break
      case error.TIMEOUT:
        message = 'Location request timeout'
        break
    }

    console.error('GPS error:', message, error)
    
    if (this.onLocationUpdate) {
      this.onLocationUpdate(null, error)
    }
  }

  async sendLocationToBackend() {
    if (!this.currentPosition) return

    // Skip if location hasn't changed significantly (optional optimization)
    if (this.lastSentLocation) {
      const distance = this.calculateDistance(
        this.currentPosition.latitude,
        this.currentPosition.longitude,
        this.lastSentLocation.latitude,
        this.lastSentLocation.longitude
      )
      
      // Only send if moved more than 10 meters
      if (distance < 10) {
        return
      }
    }

    try {
      await api.updateLocation(
        this.currentPosition.latitude,
        this.currentPosition.longitude,
        this.currentPosition.accuracy
      )
      
      this.lastSentLocation = { ...this.currentPosition }
    } catch (error) {
      console.error('Failed to send location to backend:', error)
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance
  }

  isWithinRadius(lat1, lon1, lat2, lon2, radiusMeters) {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2)
    return distance <= radiusMeters
  }

  getCurrentLocation() {
    return this.currentPosition
  }

  getLastSavedLocation() {
    return storage.getLastLocation()
  }
}

export default new GpsService()

