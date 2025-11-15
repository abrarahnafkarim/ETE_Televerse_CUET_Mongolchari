import type {
  ApiResponse,
  PaginatedResponse,
  Ride,
  User,
  Puller,
  Review,
  DashboardStats,
  LeaderboardEntry,
  PopularDestination,
  PointAdjustment,
  RideFilters,
  UserFilters,
  LoginCredentials,
  AuthToken,
  Admin,
} from '../types';
import {
  MOCK_USERS,
  MOCK_PULLERS,
  MOCK_RIDES,
  MOCK_REVIEWS,
  MOCK_DASHBOARD_STATS,
  MOCK_LEADERBOARD,
  MOCK_POPULAR_DESTINATIONS,
  MOCK_POINT_ADJUSTMENTS,
} from '../mock/mockData';

// Simulated network delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

class MockApiService {
  private users: User[] = [...MOCK_USERS];
  private pullers: Puller[] = [...MOCK_PULLERS];
  private rides: Ride[] = [...MOCK_RIDES];
  private reviews: Review[] = [...MOCK_REVIEWS];
  private pointAdjustments: PointAdjustment[] = [...MOCK_POINT_ADJUSTMENTS];
  private stats: DashboardStats = { ...MOCK_DASHBOARD_STATS };

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthToken & { admin: Admin }>> {
    await delay();

    // Simple mock authentication
    if (
      credentials.email === (import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@aeras.com') &&
      credentials.password === (import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'admin123')
    ) {
      const token = 'mock_jwt_token_' + Date.now();
      const admin: Admin = {
        id: 'admin_001',
        name: 'Admin User',
        email: credentials.email,
        phone: '+256700000000',
        points: 0,
        role: 'admin',
        status: 'active',
        blockId: '',
        createdAt: '2024-01-01T00:00:00Z',
        permissions: ['all'],
      };

      return {
        success: true,
        data: {
          token,
          refreshToken: 'mock_refresh_token_' + Date.now(),
          expiresIn: 3600,
          admin,
        },
      };
    }

    return {
      success: false,
      error: 'Invalid credentials',
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    await delay();
    return { success: true };
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthToken>> {
    await delay();
    return {
      success: true,
      data: {
        token: 'mock_jwt_token_refreshed_' + Date.now(),
        refreshToken: 'mock_refresh_token_refreshed_' + Date.now(),
        expiresIn: 3600,
      },
    };
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await delay();
    // Update with current data counts
    this.stats.activeRides = this.rides.filter((r) => r.status === 'in-transit' || r.status === 'waiting').length;
    this.stats.pendingReviews = this.reviews.filter((r) => r.status === 'pending').length;
    this.stats.onlinePullers = this.pullers.filter((p) => p.status === 'online' || p.status === 'busy').length;

    return { success: true, data: this.stats };
  }

  async getRides(
    filters?: RideFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Ride>>> {
    await delay();

    let filtered = [...this.rides];

    if (filters?.status?.length) {
      filtered = filtered.filter((r) => filters.status!.includes(r.status));
    }

    if (filters?.userId) {
      filtered = filtered.filter((r) => r.userId === filters.userId);
    }

    if (filters?.pullerId) {
      filtered = filtered.filter((r) => r.pullerId === filters.pullerId);
    }

    if (filters?.blockId) {
      filtered = filtered.filter(
        (r) => r.pickupLocation.blockId === filters.blockId || r.dropoffLocation.blockId === filters.blockId
      );
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.userName.toLowerCase().includes(query) ||
          r.pullerName?.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getRideById(rideId: string): Promise<ApiResponse<Ride>> {
    await delay();
    const ride = this.rides.find((r) => r.id === rideId);
    if (!ride) {
      return { success: false, error: 'Ride not found' };
    }
    return { success: true, data: ride };
  }

  async cancelRide(rideId: string, reason: string): Promise<ApiResponse<void>> {
    await delay();
    const ride = this.rides.find((r) => r.id === rideId);
    if (!ride) {
      return { success: false, error: 'Ride not found' };
    }
    ride.status = 'cancelled';
    ride.cancelledAt = new Date().toISOString();
    ride.notes = reason;
    return { success: true };
  }

  async reassignRide(rideId: string, newPullerId: string): Promise<ApiResponse<void>> {
    await delay();
    const ride = this.rides.find((r) => r.id === rideId);
    const puller = this.pullers.find((p) => p.id === newPullerId);

    if (!ride) return { success: false, error: 'Ride not found' };
    if (!puller) return { success: false, error: 'Puller not found' };

    ride.pullerId = newPullerId;
    ride.pullerName = puller.name;
    return { success: true, message: 'Ride reassigned successfully' };
  }

  async getUsers(
    filters?: UserFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    await delay();

    let filtered = [...this.users];

    if (filters?.role?.length) {
      filtered = filtered.filter((u) => filters.role!.includes(u.role as any));
    }

    if (filters?.status?.length) {
      filtered = filtered.filter((u) => filters.status!.includes(u.status));
    }

    if (filters?.blockId) {
      filtered = filtered.filter((u) => u.blockId === filters.blockId);
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phone.includes(query)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    await delay();
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: user };
  }

  async suspendUser(userId: string, reason: string, duration?: number): Promise<ApiResponse<void>> {
    await delay();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    user.status = 'suspended';
    return { success: true, message: `User suspended for ${duration || 'indefinite'} days` };
  }

  async banUser(userId: string, reason: string): Promise<ApiResponse<void>> {
    await delay();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    user.status = 'banned';
    return { success: true, message: 'User banned successfully' };
  }

  async unbanUser(userId: string): Promise<ApiResponse<void>> {
    await delay();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    user.status = 'active';
    return { success: true, message: 'User unbanned successfully' };
  }

  async getPullers(
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Puller>>> {
    await delay();

    const total = this.pullers.length;
    const start = (page - 1) * pageSize;
    const items = this.pullers.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getPullerById(pullerId: string): Promise<ApiResponse<Puller>> {
    await delay();
    const puller = this.pullers.find((p) => p.id === pullerId);
    if (!puller) {
      return { success: false, error: 'Puller not found' };
    }
    return { success: true, data: puller };
  }

  async getReviews(
    status?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    await delay();

    let filtered = [...this.reviews];
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async approveReview(reviewId: string, resolution: string): Promise<ApiResponse<void>> {
    await delay();
    const review = this.reviews.find((r) => r.id === reviewId);
    if (!review) return { success: false, error: 'Review not found' };

    review.status = 'approved';
    review.reviewedAt = new Date().toISOString();
    review.reviewedBy = 'admin@aeras.com';
    review.resolution = resolution;

    return { success: true, message: 'Review approved successfully' };
  }

  async rejectReview(reviewId: string, reason: string): Promise<ApiResponse<void>> {
    await delay();
    const review = this.reviews.find((r) => r.id === reviewId);
    if (!review) return { success: false, error: 'Review not found' };

    review.status = 'rejected';
    review.reviewedAt = new Date().toISOString();
    review.reviewedBy = 'admin@aeras.com';
    review.resolution = reason;

    return { success: true, message: 'Review rejected successfully' };
  }

  async adjustPoints(
    userId: string,
    amount: number,
    reason: string
  ): Promise<ApiResponse<PointAdjustment>> {
    await delay();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    const adjustment: PointAdjustment = {
      id: `adj_${Date.now()}`,
      userId,
      userName: user.name,
      adminId: 'admin_001',
      adminName: 'Admin User',
      amount,
      reason,
      previousBalance: user.points,
      newBalance: user.points + amount,
      timestamp: new Date().toISOString(),
    };

    user.points += amount;
    this.pointAdjustments.unshift(adjustment);

    return { success: true, data: adjustment };
  }

  async getPointAdjustments(
    userId?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<PointAdjustment>>> {
    await delay();

    let filtered = [...this.pointAdjustments];
    if (userId) {
      filtered = filtered.filter((a) => a.userId === userId);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getLeaderboard(limit: number = 10): Promise<ApiResponse<LeaderboardEntry[]>> {
    await delay();
    return { success: true, data: MOCK_LEADERBOARD.slice(0, limit) };
  }

  async getPopularDestinations(limit: number = 5): Promise<ApiResponse<PopularDestination[]>> {
    await delay();
    return { success: true, data: MOCK_POPULAR_DESTINATIONS.slice(0, limit) };
  }

  async getTimeSeriesData(
    metric: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<any>> {
    await delay();
    // Generate mock time series data
    const data = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Math.floor(Math.random() * 50) + 20,
    }));
    return { success: true, data };
  }

  // Get live data (for WebSocket simulation)
  getLiveRides(): Ride[] {
    return this.rides.filter((r) => r.status === 'waiting' || r.status === 'in-transit');
  }

  getLivePullers(): Puller[] {
    return this.pullers.filter((p) => p.status === 'online' || p.status === 'busy');
  }
}

export const mockApiService = new MockApiService();
export default mockApiService;

