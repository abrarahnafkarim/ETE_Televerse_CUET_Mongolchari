import axios, { AxiosInstance, AxiosError } from 'axios';
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
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthToken>> {
    const response = await this.client.post('/api/admin/login', credentials);
    return response.data;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.client.post('/api/admin/logout');
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthToken>> {
    const response = await this.client.post('/api/admin/refresh', { refreshToken });
    return response.data;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await this.client.get('/api/admin/stats');
    return response.data;
  }

  // Rides
  async getRides(
    filters?: RideFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Ride>>> {
    const response = await this.client.get('/api/admin/rides', {
      params: { ...filters, page, pageSize },
    });
    return response.data;
  }

  async getRideById(rideId: string): Promise<ApiResponse<Ride>> {
    const response = await this.client.get(`/api/admin/rides/${rideId}`);
    return response.data;
  }

  async cancelRide(rideId: string, reason: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/admin/rides/${rideId}/cancel`, { reason });
    return response.data;
  }

  async reassignRide(rideId: string, newPullerId: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/admin/rides/${rideId}/reassign`, {
      pullerId: newPullerId,
    });
    return response.data;
  }

  // Users
  async getUsers(
    filters?: UserFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await this.client.get('/api/admin/users', {
      params: { ...filters, page, pageSize },
    });
    return response.data;
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    const response = await this.client.get(`/api/admin/users/${userId}`);
    return response.data;
  }

  async suspendUser(userId: string, reason: string, duration?: number): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/admin/users/${userId}/suspend`, {
      reason,
      duration,
    });
    return response.data;
  }

  async banUser(userId: string, reason: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/admin/users/${userId}/ban`, { reason });
    return response.data;
  }

  async unbanUser(userId: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/admin/users/${userId}/unban`);
    return response.data;
  }

  // Pullers
  async getPullers(
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Puller>>> {
    const response = await this.client.get('/api/admin/pullers', {
      params: { page, pageSize },
    });
    return response.data;
  }

  async getPullerById(pullerId: string): Promise<ApiResponse<Puller>> {
    const response = await this.client.get(`/api/admin/pullers/${pullerId}`);
    return response.data;
  }

  // Reviews
  async getReviews(
    status?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    const response = await this.client.get('/api/admin/reviews', {
      params: { status, page, pageSize },
    });
    return response.data;
  }

  async approveReview(reviewId: string, resolution: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/admin/reviews/${reviewId}/approve`, {
      resolution,
    });
    return response.data;
  }

  async rejectReview(reviewId: string, reason: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/admin/reviews/${reviewId}/reject`, { reason });
    return response.data;
  }

  // Point Adjustments
  async adjustPoints(
    userId: string,
    amount: number,
    reason: string
  ): Promise<ApiResponse<PointAdjustment>> {
    const response = await this.client.post(`/api/admin/users/${userId}/adjust-points`, {
      amount,
      reason,
    });
    return response.data;
  }

  async getPointAdjustments(
    userId?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedResponse<PointAdjustment>>> {
    const response = await this.client.get('/api/admin/point-adjustments', {
      params: { userId, page, pageSize },
    });
    return response.data;
  }

  // Analytics
  async getLeaderboard(limit: number = 10): Promise<ApiResponse<LeaderboardEntry[]>> {
    const response = await this.client.get('/api/admin/analytics/leaderboard', {
      params: { limit },
    });
    return response.data;
  }

  async getPopularDestinations(limit: number = 5): Promise<ApiResponse<PopularDestination[]>> {
    const response = await this.client.get('/api/admin/analytics/destinations', {
      params: { limit },
    });
    return response.data;
  }

  async getTimeSeriesData(
    metric: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<any>> {
    const response = await this.client.get('/api/admin/analytics/timeseries', {
      params: { metric, startDate, endDate },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;

