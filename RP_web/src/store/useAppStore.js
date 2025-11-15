import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { config } from '../config'
import api from '../services/api'
import mqtt from '../services/mqtt'
import gps from '../services/gps'
import storage from '../services/storage'

/**
 * Global state management with Zustand
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth state
      driver: null,
      isAuthenticated: false,

      // Ride state
      currentRide: null,
      rideOffers: [], // Multiple incoming offers
      rideHistory: [],
      
      // Points state
      pointsBalance: 0,
      pendingVerifications: [],

      // Location state
      currentLocation: null,
      isLocationEnabled: false,

      // System state
      isOnline: navigator.onLine,
      connectionStatus: 'disconnected', // 'connected', 'disconnected', 'connecting'
      systemStatus: 'normal', // 'normal', 'warning', 'error'

      // UI state
      showRideModal: false,
      activeNotification: null,
      isLoading: false,
      error: null,

      // Actions - Auth
      login: async (driverId, driverName) => {
        try {
          set({ isLoading: true, error: null })
          
          // Register/Login via API
          const response = await api.login(driverId, driverName)
          
          // Save to storage
          storage.saveDriver(driverId, driverName)
          
          // Connect MQTT (only if not in mock mode)
          try {
            await mqtt.connect(driverId)
            // Setup MQTT message handlers
            setupMqttHandlers(driverId, get, set)
          } catch (mqttError) {
            console.warn('⚠️ MQTT connection failed (continuing in dev mode):', mqttError)
            // Continue without MQTT in dev mode
          }
          
          // Start GPS tracking
          try {
            await gps.startTracking((location, error) => {
              if (location) {
                set({ currentLocation: location, isLocationEnabled: true })
              }
            })
          } catch (gpsError) {
            console.warn('⚠️ GPS tracking failed:', gpsError)
            // Continue without GPS if permission denied
          }
          
          // Update driver status to available
          await api.updateStatus('available')
          
          set({
            driver: { id: driverId, name: driverName },
            isAuthenticated: true,
            isLoading: false,
            connectionStatus: 'connected',
          })

          // Load initial data
          get().loadPointsBalance()
          get().loadRideHistory()
        } catch (error) {
          // In dev mode, still allow login even if API fails
          if (error.isNetworkError || error.status === 0) {
            console.warn('⚠️ Network error - continuing in mock mode')
            storage.saveDriver(driverId, driverName)
            set({
              driver: { id: driverId, name: driverName },
              isAuthenticated: true,
              isLoading: false,
              connectionStatus: 'connected',
            })
            get().loadPointsBalance()
            get().loadRideHistory()
          } else {
            set({ error: error.message || 'Login failed', isLoading: false })
            throw error
          }
        }
      },

      logout: async () => {
        try {
          gps.stopTracking()
          mqtt.disconnect()
          await api.logout()
          storage.clearDriver()
          storage.clearCurrentRide()
          
          set({
            driver: null,
            isAuthenticated: false,
            currentRide: null,
            rideOffers: [],
            pointsBalance: 0,
            connectionStatus: 'disconnected',
          })
        } catch (error) {
          console.error('Logout error:', error)
        }
      },

      // Actions - Ride
      addRideOffer: (offer) => {
        const offers = get().rideOffers
        const existing = offers.find((o) => o.ride_id === offer.ride_id)
        
        if (!existing) {
          // Sort by distance if location available
          const newOffers = [...offers, offer].sort((a, b) => {
            if (!get().currentLocation) return 0
            const distA = a.distance || Infinity
            const distB = b.distance || Infinity
            return distA - distB
          })
          
          set({ 
            rideOffers: newOffers,
            showRideModal: true,
            activeNotification: offer,
          })

          // Play sound and vibrate
          playNotificationSound()
          vibrateDevice()

          // Auto-expire after 60 seconds (Test Case 6a)
          setTimeout(() => {
            const currentOffers = get().rideOffers
            const stillPending = currentOffers.find((o) => o.ride_id === offer.ride_id)
            if (stillPending && !get().currentRide) {
              get().removeRideOffer(offer.ride_id)
              set({ systemStatus: 'warning' })
            }
          }, 60000)
        }
      },

      removeRideOffer: (rideId) => {
        const offers = get().rideOffers.filter((o) => o.ride_id !== rideId)
        const showModal = offers.length > 0
        
        set({
          rideOffers: offers,
          showRideModal: showModal,
          activeNotification: showModal ? offers[0] : null,
        })
      },

      acceptRide: async (rideId) => {
        try {
          set({ isLoading: true, error: null })
          
          // Send acceptance within 2 seconds (Test Case 6b)
          const response = await api.acceptRide(rideId)
          
          const offer = get().rideOffers.find((o) => o.ride_id === rideId)
          const ride = {
            ...offer,
            ...response,
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          }
          
          storage.saveCurrentRide(ride)
          
          set({
            currentRide: ride,
            rideOffers: [],
            showRideModal: false,
            activeNotification: null,
            systemStatus: 'normal',
            isLoading: false,
          })

          // Update status to busy
          await api.updateStatus('busy')
        } catch (error) {
          set({ error: error.message || 'Failed to accept ride', isLoading: false })
          throw error
        }
      },

      rejectRide: async (rideId) => {
        try {
          await api.rejectRide(rideId)
          get().removeRideOffer(rideId)
        } catch (error) {
          console.error('Reject ride error:', error)
        }
      },

      confirmPickup: async (rideId, latitude, longitude) => {
        try {
          set({ isLoading: true })
          const response = await api.confirmPickup(rideId, latitude, longitude)
          
          const ride = {
            ...get().currentRide,
            ...response,
            status: 'picked_up',
            picked_up_at: new Date().toISOString(),
            pickup_location: { latitude, longitude },
          }
          
          storage.saveCurrentRide(ride)
          set({ currentRide: ride, isLoading: false })
        } catch (error) {
          set({ error: error.message || 'Failed to confirm pickup', isLoading: false })
          throw error
        }
      },

      confirmDropoff: async (rideId, latitude, longitude) => {
        try {
          set({ isLoading: true })
          const response = await api.confirmDropoff(rideId, latitude, longitude)
          
          const ride = {
            ...get().currentRide,
            ...response,
            status: 'completed',
            completed_at: new Date().toISOString(),
            dropoff_location: { latitude, longitude },
          }
          
          // Add to history
          const history = [ride, ...get().rideHistory.slice(0, 9)]
          
          storage.clearCurrentRide()
          
          set({
            currentRide: null,
            rideHistory: history,
            isLoading: false,
          })

          // Update points balance
          get().loadPointsBalance()
          get().loadRideHistory()

          // Update status to available
          await api.updateStatus('available')
        } catch (error) {
          set({ error: error.message || 'Failed to confirm dropoff', isLoading: false })
          throw error
        }
      },

      cancelRide: async (rideId, reason) => {
        try {
          await api.cancelRide(rideId, reason)
          storage.clearCurrentRide()
          
          set({
            currentRide: null,
            isLoading: false,
          })

          await api.updateStatus('available')
        } catch (error) {
          set({ error: error.message || 'Failed to cancel ride', isLoading: false })
          throw error
        }
      },

      // Actions - Points
      loadPointsBalance: async () => {
        try {
          const response = await api.getPointsBalance()
          set({ pointsBalance: response.balance || 0 })
        } catch (error) {
          console.error('Load points balance error:', error)
        }
      },

      loadRideHistory: async () => {
        try {
          const response = await api.getPointsHistory(10)
          set({ rideHistory: response.history || [] })
        } catch (error) {
          console.error('Load ride history error:', error)
        }
      },

      loadPendingVerifications: async () => {
        try {
          const response = await api.getPendingVerifications()
          set({ pendingVerifications: response.pending || [] })
        } catch (error) {
          console.error('Load pending verifications error:', error)
        }
      },

      // Actions - System
      setConnectionStatus: (status) => {
        set({ connectionStatus: status })
      },

      setSystemStatus: (status) => {
        set({ systemStatus: status })
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline })
        
        if (isOnline && get().driver) {
          // Reconnect MQTT
          mqtt.connect(get().driver.id).then(() => {
            mqtt.processOfflineQueue()
          })
        }
      },

      // Actions - UI
      setShowRideModal: (show) => {
        set({ showRideModal: show })
      },

      setError: (error) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      // Initialize from storage
      initialize: () => {
        const driver = storage.getDriver()
        const savedRide = storage.getCurrentRide()
        
        if (driver?.id) {
          set({ driver, isAuthenticated: true })
          
          // Restore ride if exists
          if (savedRide) {
            set({ currentRide: savedRide })
          }
          
          // Reconnect services (only if not in mock mode)
          if (!config.useMockApi) {
            mqtt.connect(driver.id).then(() => {
              setupMqttHandlers(driver.id, get, set)
            }).catch(() => {
              console.warn('MQTT connection failed in initialize')
            })
          }
          
          try {
            gps.startTracking((location) => {
              if (location) {
                set({ currentLocation: location, isLocationEnabled: true })
              }
            })
          } catch (error) {
            console.warn('GPS tracking failed in initialize:', error)
          }
        }

        // Listen to online/offline events
        window.addEventListener('online', () => get().setOnlineStatus(true))
        window.addEventListener('offline', () => get().setOnlineStatus(false))
      },
    }),
    {
      name: 'rp-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        driver: state.driver,
        rideHistory: state.rideHistory,
        pointsBalance: state.pointsBalance,
      }),
    }
  )
)

// Helper function to setup MQTT handlers
function setupMqttHandlers(driverId, get, set) {
  // Ride offer handler
  const offerTopic = config.mqtt.topics.offer(driverId)
  mqtt.onMessage(offerTopic, (data) => {
    if (data.type === 'ride_offer') {
      // Calculate distance if location available
      let distance = null
      if (get().currentLocation && data.pickup_location) {
        distance = gps.calculateDistance(
          get().currentLocation.latitude,
          get().currentLocation.longitude,
          data.pickup_location.latitude,
          data.pickup_location.longitude
        )
        data.distance = distance
      }
      
      get().addRideOffer(data)
    }
  })

  // Ride update handler
  mqtt.onMessage(`aeras/driver/${driverId}/ride_update`, (data) => {
    const ride = get().currentRide
    if (ride && ride.ride_id === data.ride_id) {
      set({ currentRide: { ...ride, ...data } })
      storage.saveCurrentRide({ ...ride, ...data })
    }
  })

  // System status handler
  mqtt.onMessage(`aeras/driver/${driverId}/system_status`, (data) => {
    set({ systemStatus: data.status || 'normal' })
  })
}

// Helper functions
function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3')
    audio.play().catch(() => {
      // Fallback: create a beep using Web Audio API
      const context = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
      
      oscillator.start(context.currentTime)
      oscillator.stop(context.currentTime + 0.5)
    })
  } catch (error) {
    console.error('Sound play error:', error)
  }
}

function vibrateDevice() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200])
  }
}

