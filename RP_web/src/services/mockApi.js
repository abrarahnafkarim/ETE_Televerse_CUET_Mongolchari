/**
 * Mock API Service for Development
 * Use when backend is not available
 */
class MockApiService {
  constructor() {
    this.mockDrivers = new Map()
    this.mockRides = new Map()
    this.mockPoints = new Map()
    this.mockCurrentRide = null
    
    // Initialize mock data
    this.initMockData()
  }

  initMockData() {
    // Mock driver data
    this.mockDrivers.set('driver_001', {
      id: 'driver_001',
      name: 'Test Driver',
      status: 'available',
      total_points: 1250,
      total_rides: 12,
    })

    // Mock points data
    this.mockPoints.set('driver_001', {
      balance: 1250,
      total_earned: 1350,
      total_spent: 100,
    })

    // Mock ride history
    this.mockRideHistory = [
      {
        ride_id: 'ride_001',
        completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        points_awarded: 30,
        pickup_address: 'Pahartoli',
        destination_address: 'Noapara',
        fare: 80,
        distance: 4500,
        status: 'completed',
      },
      {
        ride_id: 'ride_002',
        completed_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        points_awarded: 25,
        pickup_address: 'Noapara',
        destination_address: 'Raojan',
        fare: 60,
        distance: 3800,
        status: 'completed',
      },
      {
        ride_id: 'ride_003',
        completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        points_awarded: 35,
        pickup_address: 'Raojan',
        destination_address: 'Pahartoli',
        fare: 120,
        distance: 8200,
        status: 'completed',
      },
      {
        ride_id: 'ride_004',
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        points_awarded: 20,
        pickup_address: 'Pahartoli',
        destination_address: 'Raojan',
        fare: 50,
        distance: 3200,
        status: 'completed',
      },
      {
        ride_id: 'ride_005',
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        points_awarded: 28,
        pickup_address: 'Noapara',
        destination_address: 'Pahartoli',
        fare: 70,
        distance: 4100,
        status: 'completed',
      },
      {
        ride_id: 'ride_006',
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        points_awarded: 22,
        pickup_address: 'Raojan',
        destination_address: 'Noapara',
        fare: 55,
        distance: 3500,
        status: 'completed',
      },
      {
        ride_id: 'ride_007',
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        points_awarded: 32,
        pickup_address: 'Pahartoli',
        destination_address: 'Noapara',
        fare: 90,
        distance: 5600,
        status: 'completed',
      },
      {
        ride_id: 'ride_008',
        completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        points_awarded: 27,
        pickup_address: 'Noapara',
        destination_address: 'Raojan',
        fare: 65,
        distance: 3900,
        status: 'completed',
      },
      {
        ride_id: 'ride_009',
        completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        points_awarded: 29,
        pickup_address: 'Raojan',
        destination_address: 'Pahartoli',
        fare: 75,
        distance: 4300,
        status: 'completed',
      },
      {
        ride_id: 'ride_010',
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        points_awarded: 24,
        pickup_address: 'Pahartoli',
        destination_address: 'Noapara',
        fare: 58,
        distance: 3700,
        status: 'completed',
      },
    ]
  }

  // Simulate network delay
  async delay(ms = 500) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Auth endpoints
  async login(driverId, driverName) {
    await this.delay(500)
    
    // Store driver info
    this.mockDrivers.set(driverId, {
      id: driverId,
      name: driverName,
      status: 'available',
      total_points: this.mockPoints.get(driverId)?.balance || 0,
      total_rides: 0,
    })

    if (!this.mockPoints.has(driverId)) {
      this.mockPoints.set(driverId, {
        balance: 0,
        total_earned: 0,
        total_spent: 0,
      })
    }

    return {
      success: true,
      driver_id: driverId,
      driver_name: driverName,
      token: 'mock_token_' + Date.now(),
    }
  }

  async register(driverId, driverName) {
    return this.login(driverId, driverName)
  }

  async logout() {
    await this.delay(200)
    return { success: true, message: 'Logged out successfully' }
  }

  // Driver endpoints
  async getProfile() {
    await this.delay(300)
    const drivers = Array.from(this.mockDrivers.values())
    return drivers[0] || { driver_id: 'driver_001', driver_name: 'Test Driver', status: 'available', total_points: 0, total_rides: 0 }
  }

  async updateLocation(latitude, longitude, accuracy) {
    await this.delay(100)
    return { success: true, message: 'Location updated' }
  }

  async updateStatus(status) {
    await this.delay(200)
    return { success: true, status }
  }

  // Ride endpoints
  async acceptRide(rideId) {
    await this.delay(500)
    
    // Sample locations: Pahartoli, Noapara, Raojan
    const locations = [
      {
        pickup: { lat: 22.3964, lng: 91.8129, address: 'Pahartoli' },
        dest: { lat: 22.4300, lng: 91.7900, address: 'Noapara' },
        fare: 80,
        distance: 4500,
      },
      {
        pickup: { lat: 22.4300, lng: 91.7900, address: 'Noapara' },
        dest: { lat: 22.5000, lng: 91.9200, address: 'Raojan' },
        fare: 60,
        distance: 3800,
      },
      {
        pickup: { lat: 22.5000, lng: 91.9200, address: 'Raojan' },
        dest: { lat: 22.3964, lng: 91.8129, address: 'Pahartoli' },
        fare: 120,
        distance: 8200,
      },
      {
        pickup: { lat: 22.3964, lng: 91.8129, address: 'Pahartoli' },
        dest: { lat: 22.5000, lng: 91.9200, address: 'Raojan' },
        fare: 70,
        distance: 4100,
      },
      {
        pickup: { lat: 22.4300, lng: 91.7900, address: 'Noapara' },
        dest: { lat: 22.3964, lng: 91.8129, address: 'Pahartoli' },
        fare: 65,
        distance: 3900,
      },
      {
        pickup: { lat: 22.5000, lng: 91.9200, address: 'Raojan' },
        dest: { lat: 22.4300, lng: 91.7900, address: 'Noapara' },
        fare: 75,
        distance: 4300,
      },
    ]
    
    const location = locations[Math.floor(Math.random() * locations.length)]
    
    const mockRide = {
      success: true,
      ride_id: rideId || `ride_${Date.now()}`,
      status: 'accepted',
      pickup_location: {
        latitude: location.pickup.lat,
        longitude: location.pickup.lng,
        address: location.pickup.address,
      },
      destination_location: {
        latitude: location.dest.lat,
        longitude: location.dest.lng,
        address: location.dest.address,
      },
      fare: location.fare,
      estimated_duration: Math.round(location.distance / 200), // Approx 200m per minute
      estimated_distance: location.distance,
      pickup_address: location.pickup.address,
      destination_address: location.dest.address,
    }

    this.mockCurrentRide = mockRide
    return mockRide
  }

  async rejectRide(rideId) {
    await this.delay(200)
    return { success: true, message: 'Ride rejected' }
  }

  async confirmPickup(rideId, latitude, longitude) {
    await this.delay(500)
    return {
      success: true,
      ride_id: rideId,
      status: 'picked_up',
      pickup_confirmed_at: new Date().toISOString(),
      message: 'Pickup confirmed. Green LED activated.',
    }
  }

  async confirmDropoff(rideId, latitude, longitude) {
    await this.delay(500)
    const pointsAwarded = 20 + Math.floor(Math.random() * 30)
    
    // Update points balance
    const currentPoints = this.mockPoints.get('driver_001') || { balance: 1250, total_earned: 1350, total_spent: 100 }
    this.mockPoints.set('driver_001', {
      balance: currentPoints.balance + pointsAwarded,
      total_earned: currentPoints.total_earned + pointsAwarded,
      total_spent: currentPoints.total_spent,
    })
    
    // Add to ride history
    const currentRide = this.mockCurrentRide
    if (currentRide) {
      const newRide = {
        ride_id: rideId,
        completed_at: new Date().toISOString(),
        points_awarded: pointsAwarded,
        pickup_address: currentRide.pickup_address || 'Pickup Location',
        destination_address: currentRide.destination_address || 'Destination',
        fare: currentRide.fare || 50,
        distance: currentRide.estimated_distance || 3000,
        status: 'completed',
      }
      this.mockRideHistory.unshift(newRide)
      // Keep only last 20 rides
      if (this.mockRideHistory.length > 20) {
        this.mockRideHistory = this.mockRideHistory.slice(0, 20)
      }
    }
    
    return {
      success: true,
      ride_id: rideId,
      status: 'completed',
      dropoff_confirmed_at: new Date().toISOString(),
      points_awarded: pointsAwarded,
      message: 'Drop-off confirmed. Points awarded.',
    }
  }

  async cancelRide(rideId, reason) {
    await this.delay(300)
    this.mockCurrentRide = null
    return { success: true, message: 'Ride cancelled' }
  }

  async getCurrentRide() {
    await this.delay(200)
    return this.mockCurrentRide
  }

  // Points endpoints
  async getPointsBalance() {
    await this.delay(300)
    const pointsData = this.mockPoints.get('driver_001') || { balance: 1250, total_earned: 1350, total_spent: 100 }
    return { 
      balance: pointsData.balance, 
      total_earned: pointsData.total_earned, 
      total_spent: pointsData.total_spent 
    }
  }

  async getPointsHistory(limit = 10) {
    await this.delay(300)
    return { history: (this.mockRideHistory || []).slice(0, limit) }
  }

  async getPendingVerifications() {
    await this.delay(300)
    // Add a pending verification for demo
    return { 
      pending: [
        {
          id: 'verification_001',
          ride_id: 'ride_pending_001',
          pickup_address: 'Pahartoli',
          destination_address: 'Noapara',
          status: 'pending',
          submitted_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        }
      ] 
    }
  }
}

export default new MockApiService()

