/**
 * LocalStorage service for offline persistence
 */
class StorageService {
  set(key, value) {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  }

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item)
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  }

  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  }

  // Driver-specific methods
  saveDriver(driverId, driverName) {
    this.set('rp_driver_id', driverId)
    this.set('rp_driver_name', driverName)
  }

  getDriver() {
    return {
      id: this.get('rp_driver_id'),
      name: this.get('rp_driver_name'),
    }
  }

  clearDriver() {
    this.remove('rp_driver_id')
    this.remove('rp_driver_name')
  }

  // Ride methods
  saveCurrentRide(ride) {
    this.set('rp_current_ride', ride)
  }

  getCurrentRide() {
    return this.get('rp_current_ride')
  }

  clearCurrentRide() {
    this.remove('rp_current_ride')
  }

  // Offline queue
  addToOfflineQueue(action) {
    const queue = this.get('rp_offline_queue', [])
    queue.push({
      ...action,
      timestamp: Date.now(),
    })
    this.set('rp_offline_queue', queue)
  }

  getOfflineQueue() {
    return this.get('rp_offline_queue', [])
  }

  clearOfflineQueue() {
    this.set('rp_offline_queue', [])
  }

  // Settings
  saveSettings(settings) {
    this.set('rp_settings', settings)
  }

  getSettings() {
    return this.get('rp_settings', {
      gpsUpdateInterval: 5000,
      soundEnabled: true,
      vibrationEnabled: true,
      notificationsEnabled: true,
    })
  }

  // Location
  saveLastLocation(location) {
    this.set('rp_last_location', {
      ...location,
      timestamp: Date.now(),
    })
  }

  getLastLocation() {
    return this.get('rp_last_location')
  }
}

export default new StorageService()

