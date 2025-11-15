import type { 
  User, 
  Puller, 
  Ride, 
  Review, 
  Block, 
  DashboardStats, 
  LeaderboardEntry,
  PopularDestination,
  PointAdjustment,
  Location
} from '../types';

// Kampala blocks (example locations)
export const BLOCKS: Block[] = [
  { id: 'blk_001', name: 'Makerere', latitude: 0.3341, longitude: 32.5702, activeUsers: 45, activePullers: 12 },
  { id: 'blk_002', name: 'Wandegeya', latitude: 0.3356, longitude: 32.5689, activeUsers: 38, activePullers: 9 },
  { id: 'blk_003', name: 'Nakawa', latitude: 0.3371, longitude: 32.6158, activeUsers: 52, activePullers: 15 },
  { id: 'blk_004', name: 'Ntinda', latitude: 0.3569, longitude: 32.6267, activeUsers: 61, activePullers: 18 },
  { id: 'blk_005', name: 'Kamwokya', latitude: 0.3443, longitude: 32.5892, activeUsers: 33, activePullers: 8 },
  { id: 'blk_006', name: 'Kololo', latitude: 0.3255, longitude: 32.5989, activeUsers: 28, activePullers: 7 },
  { id: 'blk_007', name: 'Naguru', latitude: 0.3344, longitude: 32.6067, activeUsers: 41, activePullers: 11 },
  { id: 'blk_008', name: 'Bukoto', latitude: 0.3489, longitude: 32.6034, activeUsers: 35, activePullers: 10 },
];

// Mock Users
export const MOCK_USERS: User[] = [
  {
    id: 'usr_001',
    name: 'John Okello',
    email: 'john.okello@example.com',
    phone: '+256700123456',
    points: 450,
    role: 'user',
    status: 'active',
    blockId: 'blk_001',
    createdAt: '2024-01-15T08:00:00Z',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'usr_002',
    name: 'Sarah Namukasa',
    email: 'sarah.n@example.com',
    phone: '+256700234567',
    points: 320,
    role: 'user',
    status: 'active',
    blockId: 'blk_002',
    createdAt: '2024-01-20T10:30:00Z',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'usr_003',
    name: 'David Musoke',
    email: 'david.m@example.com',
    phone: '+256700345678',
    points: 150,
    role: 'user',
    status: 'suspended',
    blockId: 'blk_003',
    createdAt: '2024-02-01T14:15:00Z',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Mock Pullers
export const MOCK_PULLERS: Puller[] = [
  {
    id: 'plr_001',
    name: 'James Ssemakula',
    email: 'james.s@example.com',
    phone: '+256700111222',
    currentLocation: { latitude: 0.3341, longitude: 32.5702 },
    status: 'online',
    totalPoints: 2450,
    totalRides: 156,
    rating: 4.8,
    blockId: 'blk_001',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'plr_002',
    name: 'Peter Kato',
    email: 'peter.k@example.com',
    phone: '+256700222333',
    currentLocation: { latitude: 0.3356, longitude: 32.5689 },
    status: 'busy',
    totalPoints: 3120,
    totalRides: 203,
    rating: 4.9,
    currentRideId: 'ride_002',
    blockId: 'blk_002',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'plr_003',
    name: 'Moses Mukasa',
    email: 'moses.m@example.com',
    phone: '+256700333444',
    currentLocation: { latitude: 0.3371, longitude: 32.6158 },
    status: 'online',
    totalPoints: 1890,
    totalRides: 128,
    rating: 4.6,
    blockId: 'blk_003',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'plr_004',
    name: 'Francis Wasswa',
    email: 'francis.w@example.com',
    phone: '+256700444555',
    currentLocation: { latitude: 0.3569, longitude: 32.6267 },
    status: 'online',
    totalPoints: 2780,
    totalRides: 178,
    rating: 4.7,
    blockId: 'blk_004',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'plr_005',
    name: 'Robert Nsubuga',
    email: 'robert.n@example.com',
    phone: '+256700555666',
    currentLocation: { latitude: 0.3443, longitude: 32.5892 },
    status: 'offline',
    totalPoints: 1560,
    totalRides: 98,
    rating: 4.5,
    blockId: 'blk_005',
    lastActive: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Mock Rides
export const MOCK_RIDES: Ride[] = [
  {
    id: 'ride_001',
    userId: 'usr_001',
    userName: 'John Okello',
    pullerId: 'plr_001',
    pullerName: 'James Ssemakula',
    pickupLocation: { latitude: 0.3341, longitude: 32.5702, blockId: 'blk_001', address: 'Makerere Main Gate' },
    dropoffLocation: { latitude: 0.3255, longitude: 32.5989, blockId: 'blk_006', address: 'Kololo Shopping Center' },
    status: 'completed',
    points: 25,
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    acceptedAt: new Date(Date.now() - 3540000).toISOString(),
    completedAt: new Date(Date.now() - 2400000).toISOString(),
    distance: 3.2,
    duration: 18,
    gpsPath: [
      { latitude: 0.3341, longitude: 32.5702 },
      { latitude: 0.3320, longitude: 32.5750 },
      { latitude: 0.3290, longitude: 32.5850 },
      { latitude: 0.3255, longitude: 32.5989 },
    ],
  },
  {
    id: 'ride_002',
    userId: 'usr_002',
    userName: 'Sarah Namukasa',
    pullerId: 'plr_002',
    pullerName: 'Peter Kato',
    pickupLocation: { latitude: 0.3356, longitude: 32.5689, blockId: 'blk_002', address: 'Wandegeya Market' },
    dropoffLocation: { latitude: 0.3489, longitude: 32.6034, blockId: 'blk_008', address: 'Bukoto Square' },
    status: 'in-transit',
    points: 30,
    requestedAt: new Date(Date.now() - 600000).toISOString(),
    acceptedAt: new Date(Date.now() - 540000).toISOString(),
    distance: 4.5,
    gpsPath: [
      { latitude: 0.3356, longitude: 32.5689 },
      { latitude: 0.3380, longitude: 32.5780 },
      { latitude: 0.3420, longitude: 32.5920 },
    ],
  },
  {
    id: 'ride_003',
    userId: 'usr_001',
    userName: 'John Okello',
    pickupLocation: { latitude: 0.3371, longitude: 32.6158, blockId: 'blk_003', address: 'Nakawa Market' },
    dropoffLocation: { latitude: 0.3569, longitude: 32.6267, blockId: 'blk_004', address: 'Ntinda Complex' },
    status: 'waiting',
    points: 35,
    requestedAt: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: 'ride_004',
    userId: 'usr_003',
    userName: 'David Musoke',
    pullerId: 'plr_003',
    pullerName: 'Moses Mukasa',
    pickupLocation: { latitude: 0.3443, longitude: 32.5892, blockId: 'blk_005', address: 'Kamwokya Junction' },
    dropoffLocation: { latitude: 0.3344, longitude: 32.6067, blockId: 'blk_007', address: 'Naguru Hospital' },
    status: 'cancelled',
    points: 20,
    requestedAt: new Date(Date.now() - 7200000).toISOString(),
    acceptedAt: new Date(Date.now() - 7140000).toISOString(),
    cancelledAt: new Date(Date.now() - 6900000).toISOString(),
    notes: 'Cancelled by user',
  },
];

// Mock Reviews
export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev_001',
    type: 'gps_dispute',
    rideId: 'ride_001',
    reporterId: 'usr_001',
    reporterName: 'John Okello',
    reporterType: 'user',
    targetId: 'plr_001',
    targetName: 'James Ssemakula',
    description: 'The GPS path shows the puller took a longer route than necessary, adding extra cost.',
    evidence: {
      gpsData: [
        { latitude: 0.3341, longitude: 32.5702 },
        { latitude: 0.3300, longitude: 32.5800 },
        { latitude: 0.3255, longitude: 32.5989 },
      ],
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'rev_002',
    type: 'points_dispute',
    rideId: 'ride_002',
    reporterId: 'plr_002',
    reporterName: 'Peter Kato',
    reporterType: 'puller',
    targetId: 'usr_002',
    targetName: 'Sarah Namukasa',
    description: 'User claims insufficient points were deducted, but system shows correct calculation.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'rev_003',
    type: 'behavior_report',
    rideId: 'ride_004',
    reporterId: 'plr_003',
    reporterName: 'Moses Mukasa',
    reporterType: 'puller',
    targetId: 'usr_003',
    targetName: 'David Musoke',
    description: 'User was aggressive and used inappropriate language during the ride.',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    reviewedAt: new Date(Date.now() - 82800000).toISOString(),
    reviewedBy: 'admin@aeras.com',
    resolution: 'User suspended for 7 days',
  },
];

// Mock Point Adjustments
export const MOCK_POINT_ADJUSTMENTS: PointAdjustment[] = [
  {
    id: 'adj_001',
    userId: 'usr_001',
    userName: 'John Okello',
    adminId: 'admin_001',
    adminName: 'Admin User',
    amount: 50,
    reason: 'Compensation for system error during ride',
    previousBalance: 400,
    newBalance: 450,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'adj_002',
    userId: 'usr_002',
    userName: 'Sarah Namukasa',
    adminId: 'admin_001',
    adminName: 'Admin User',
    amount: -30,
    reason: 'Penalty for false dispute claim',
    previousBalance: 350,
    newBalance: 320,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Mock Dashboard Stats
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  activeUsers: 333,
  onlinePullers: 80,
  activeRides: 24,
  pendingReviews: 2,
  totalRidesToday: 156,
  averageWaitTime: 4.5,
  averageRideTime: 18.3,
  totalPointsDistributed: 12450,
};

// Mock Leaderboard
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, pullerId: 'plr_002', pullerName: 'Peter Kato', points: 3120, rides: 203, rating: 4.9 },
  { rank: 2, pullerId: 'plr_004', pullerName: 'Francis Wasswa', points: 2780, rides: 178, rating: 4.7 },
  { rank: 3, pullerId: 'plr_001', pullerName: 'James Ssemakula', points: 2450, rides: 156, rating: 4.8 },
  { rank: 4, pullerId: 'plr_003', pullerName: 'Moses Mukasa', points: 1890, rides: 128, rating: 4.6 },
  { rank: 5, pullerId: 'plr_005', pullerName: 'Robert Nsubuga', points: 1560, rides: 98, rating: 4.5 },
];

// Mock Popular Destinations
export const MOCK_POPULAR_DESTINATIONS: PopularDestination[] = [
  { blockId: 'blk_pahartoli', blockName: 'Pahartoli', latitude: 22.3476, longitude: 91.8125, count: 87 },
  { blockId: 'blk_noapara', blockName: 'Noapara', latitude: 22.3650, longitude: 91.8250, count: 72 },
  { blockId: 'blk_raojan', blockName: 'Raojan', latitude: 22.3550, longitude: 91.8150, count: 65 },
];

// Helper function to generate random location near a block
export function randomLocationNear(location: Location, radiusKm: number = 1): Location {
  const radiusDegrees = radiusKm / 111; // Approximate conversion
  return {
    latitude: location.latitude + (Math.random() - 0.5) * radiusDegrees,
    longitude: location.longitude + (Math.random() - 0.5) * radiusDegrees,
  };
}

// Helper to simulate real-time updates
export function simulatePullerMovement(puller: Puller): Location {
  return randomLocationNear(puller.currentLocation, 0.5);
}

