export const config = {
  // Development mode - use mock API when backend is not available
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true' || import.meta.env.VITE_APP_ENV === 'development',
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    timeout: 10000,
    endpoints: {
      auth: {
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
      },
      driver: {
        profile: '/driver/profile',
        location: '/driver/location',
        status: '/driver/status',
      },
      ride: {
        accept: '/ride/accept',
        reject: '/ride/reject',
        pickup: '/ride/pickup',
        dropoff: '/ride/dropoff',
        cancel: '/ride/cancel',
        current: '/ride/current',
      },
      points: {
        balance: '/points/balance',
        history: '/points/history',
        pending: '/points/pending',
      },
    },
  },
  mqtt: {
    broker: import.meta.env.VITE_MQTT_BROKER_URL || 'ws://localhost:8083/mqtt',
    username: import.meta.env.VITE_MQTT_USERNAME || '',
    password: import.meta.env.VITE_MQTT_PASSWORD || '',
    clientId: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    options: {
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
      qos: 1,
    },
    topics: {
      offer: (driverId) => `aeras/driver/${driverId}/offer`,
      status: (driverId) => `aeras/driver/${driverId}/status`,
      location: (driverId) => `aeras/driver/${driverId}/location`,
      rideUpdate: (driverId) => `aeras/driver/${driverId}/ride_update`,
      systemStatus: (driverId) => `aeras/driver/${driverId}/system_status`,
    },
  },
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    options: {
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    },
  },
  gps: {
    updateInterval: 5000, // 5 seconds
    accuracy: 50, // meters
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
    pickupRadius: 50, // meters - within 20-50m for pickup
    dropoffRadius: 50, // meters - within ±50m for dropoff
  },
  ride: {
    acceptTimeout: 30000, // 30 seconds
    offerTimeout: 60000, // 60 seconds - if no driver accepts
    autoPassDelay: 2000, // 2 seconds - response time requirement
  },
  storage: {
    keys: {
      driverId: 'rp_driver_id',
      driverName: 'rp_driver_name',
      currentRide: 'rp_current_ride',
      offlineQueue: 'rp_offline_queue',
      settings: 'rp_settings',
      lastLocation: 'rp_last_location',
    },
  },
}

