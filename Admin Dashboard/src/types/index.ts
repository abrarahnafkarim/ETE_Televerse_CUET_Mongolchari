// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  role: 'user' | 'puller' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  blockId: string;
  createdAt: string;
  lastActive?: string;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  blockId?: string;
  address?: string;
}

export interface Block {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activeUsers: number;
  activePullers: number;
}

// Ride Types
export type RideStatus = 'waiting' | 'matched' | 'in-transit' | 'completed' | 'cancelled';

export interface Ride {
  id: string;
  userId: string;
  userName: string;
  pullerId?: string;
  pullerName?: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  status: RideStatus;
  points: number;
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  distance?: number;
  duration?: number;
  gpsPath?: Location[];
  notes?: string;
}

// Puller (Driver) Types
export interface Puller {
  id: string;
  name: string;
  email: string;
  phone: string;
  currentLocation: Location;
  status: 'online' | 'offline' | 'busy' | 'suspended' | 'banned';
  totalPoints: number;
  totalRides: number;
  rating: number;
  currentRideId?: string;
  blockId: string;
  lastActive: string;
}

// Review/Dispute Types
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewType = 'gps_dispute' | 'points_dispute' | 'behavior_report';

export interface Review {
  id: string;
  type: ReviewType;
  rideId: string;
  reporterId: string;
  reporterName: string;
  reporterType: 'user' | 'puller';
  targetId: string;
  targetName: string;
  description: string;
  evidence?: {
    gpsData?: Location[];
    screenshots?: string[];
    logs?: string[];
  };
  status: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resolution?: string;
}

// Point Adjustment Types
export interface PointAdjustment {
  id: string;
  userId: string;
  userName: string;
  adminId: string;
  adminName: string;
  amount: number;
  reason: string;
  previousBalance: number;
  newBalance: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Analytics Types
export interface DashboardStats {
  activeUsers: number;
  onlinePullers: number;
  activeRides: number;
  pendingReviews: number;
  totalRidesToday: number;
  averageWaitTime: number;
  averageRideTime: number;
  totalPointsDistributed: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface PopularDestination {
  blockId: string;
  blockName: string;
  latitude: number;
  longitude: number;
  count: number;
}

export interface LeaderboardEntry {
  rank: number;
  pullerId: string;
  pullerName: string;
  points: number;
  rides: number;
  rating: number;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'ride_update' | 'puller_location' | 'stats_update' | 'review_created' | 'user_status';
  data: any;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
  token: string | null;
}

// Filter Types
export interface RideFilters {
  status?: RideStatus[];
  dateFrom?: string;
  dateTo?: string;
  blockId?: string;
  userId?: string;
  pullerId?: string;
  searchQuery?: string;
}

export interface UserFilters {
  role?: ('user' | 'puller')[];
  status?: ('active' | 'suspended' | 'banned')[];
  blockId?: string;
  searchQuery?: string;
}

