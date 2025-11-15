import axios from 'axios'
import { config } from '../config'
import storage from './storage'
import mockApi from './mockApi'

/**
 * REST API Service
 */
class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (requestConfig) => {
        const driver = storage.getDriver()
        if (driver?.id) {
          requestConfig.headers['X-Driver-ID'] = driver.id
        }
        return requestConfig
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error
          return Promise.reject({
            message: error.response.data?.message || error.message,
            status: error.response.status,
            data: error.response.data,
          })
        } else if (error.request) {
          // Request made but no response
          return Promise.reject({
            message: 'Network error. Please check your connection.',
            status: 0,
            isNetworkError: true,
          })
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(driverId, driverName) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Using mock API for login')
      return mockApi.login(driverId, driverName)
    }
    return this.client.post(config.api.endpoints.auth.login, {
      driver_id: driverId,
      driver_name: driverName,
    })
  }

  async register(driverId, driverName) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Using mock API for register')
      return mockApi.register(driverId, driverName)
    }
    return this.client.post(config.api.endpoints.auth.register, {
      driver_id: driverId,
      driver_name: driverName,
    })
  }

  async logout() {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Using mock API for logout')
      await mockApi.logout()
      storage.clearDriver()
      return
    }
    try {
      await this.client.post(config.api.endpoints.auth.logout)
    } finally {
      storage.clearDriver()
    }
  }

  // Driver endpoints
  async getProfile() {
    if (config.useMockApi) return mockApi.getProfile()
    return this.client.get(config.api.endpoints.driver.profile)
  }

  async updateLocation(latitude, longitude, accuracy) {
    if (config.useMockApi) {
      // Still log location in dev mode, but don't send to backend
      console.log('🔧 [DEV MODE] Location update:', { latitude, longitude, accuracy })
      return mockApi.updateLocation(latitude, longitude, accuracy)
    }
    return this.client.post(config.api.endpoints.driver.location, {
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
    })
  }

  async updateStatus(status) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Status update:', status)
      return mockApi.updateStatus(status)
    }
    return this.client.post(config.api.endpoints.driver.status, {
      status, // 'available', 'busy', 'offline'
      timestamp: new Date().toISOString(),
    })
  }

  // Ride endpoints
  async acceptRide(rideId) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Accepting ride:', rideId)
      return mockApi.acceptRide(rideId)
    }
    return this.client.post(config.api.endpoints.ride.accept, {
      ride_id: rideId,
      timestamp: new Date().toISOString(),
    })
  }

  async rejectRide(rideId) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Rejecting ride:', rideId)
      return mockApi.rejectRide(rideId)
    }
    return this.client.post(config.api.endpoints.ride.reject, {
      ride_id: rideId,
      timestamp: new Date().toISOString(),
    })
  }

  async confirmPickup(rideId, latitude, longitude) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Confirming pickup:', { rideId, latitude, longitude })
      return mockApi.confirmPickup(rideId, latitude, longitude)
    }
    return this.client.post(config.api.endpoints.ride.pickup, {
      ride_id: rideId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    })
  }

  async confirmDropoff(rideId, latitude, longitude) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Confirming dropoff:', { rideId, latitude, longitude })
      return mockApi.confirmDropoff(rideId, latitude, longitude)
    }
    return this.client.post(config.api.endpoints.ride.dropoff, {
      ride_id: rideId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    })
  }

  async cancelRide(rideId, reason) {
    if (config.useMockApi) {
      console.log('🔧 [DEV MODE] Cancelling ride:', { rideId, reason })
      return mockApi.cancelRide(rideId, reason)
    }
    return this.client.post(config.api.endpoints.ride.cancel, {
      ride_id: rideId,
      reason,
      timestamp: new Date().toISOString(),
    })
  }

  async getCurrentRide() {
    if (config.useMockApi) return mockApi.getCurrentRide()
    return this.client.get(config.api.endpoints.ride.current)
  }

  // Points endpoints
  async getPointsBalance() {
    if (config.useMockApi) return mockApi.getPointsBalance()
    return this.client.get(config.api.endpoints.points.balance)
  }

  async getPointsHistory(limit = 10) {
    if (config.useMockApi) return mockApi.getPointsHistory(limit)
    return this.client.get(config.api.endpoints.points.history, {
      params: { limit },
    })
  }

  async getPendingVerifications() {
    if (config.useMockApi) return mockApi.getPendingVerifications()
    return this.client.get(config.api.endpoints.points.pending)
  }
}

export default new ApiService()

