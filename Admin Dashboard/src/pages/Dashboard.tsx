import React, { useEffect, useState } from 'react';
import { Users, Car, Clock, AlertCircle, TrendingUp, MapPin } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { useRealtime } from '../contexts/RealtimeContext';
import type { DashboardStats } from '../types';
import apiService from '../services/api';
import mockApiService from '../services/mockApi';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-sm text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { stats: realtimeStats, connected } = useRealtime();
  const [stats, setStats] = useState<DashboardStats | null>(realtimeStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const service = USE_MOCK ? mockApiService : apiService;
        const response = await service.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  // Update stats from realtime context
  useEffect(() => {
    if (realtimeStats) {
      setStats((prev) => ({ ...prev, ...realtimeStats } as DashboardStats));
    }
  }, [realtimeStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring of AERAS platform</p>
        </div>
        {!connected && (
          <Badge variant="warning" size="md">
            Real-time updates paused
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<Users className="text-blue-600" size={32} />}
          color="bg-blue-100"
          subtitle="Currently online"
        />
        <StatCard
          title="Online Pullers"
          value={stats.onlinePullers}
          icon={<Car className="text-green-600" size={32} />}
          color="bg-green-100"
          subtitle="Available drivers"
        />
        <StatCard
          title="Active Rides"
          value={stats.activeRides}
          icon={<MapPin className="text-purple-600" size={32} />}
          color="bg-purple-100"
          subtitle="In progress"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={<AlertCircle className="text-red-600" size={32} />}
          color="bg-red-100"
          subtitle="Requires attention"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Total Rides Today</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalRidesToday}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats.averageWaitTime.toFixed(1)}<span className="text-sm ml-1">min</span>
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Avg Ride Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats.averageRideTime.toFixed(1)}<span className="text-sm ml-1">min</span>
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Points Distributed</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats.totalPointsDistributed.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/map"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <MapPin className="mx-auto text-blue-600 mb-2" size={32} />
            <p className="font-medium text-gray-900">View Live Map</p>
          </a>
          <a
            href="/rides"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <Car className="mx-auto text-green-600 mb-2" size={32} />
            <p className="font-medium text-gray-900">Manage Rides</p>
          </a>
          <a
            href="/reviews"
            className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <AlertCircle className="mx-auto text-red-600 mb-2" size={32} />
            <p className="font-medium text-gray-900">Review Queue</p>
          </a>
          <a
            href="/analytics"
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <TrendingUp className="mx-auto text-purple-600 mb-2" size={32} />
            <p className="font-medium text-gray-900">Analytics</p>
          </a>
        </div>
      </Card>

      {/* System Status */}
      <Card title="System Status">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Real-time Connection</span>
            <Badge variant={connected ? 'success' : 'danger'}>
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">API Status</span>
            <Badge variant="success">Operational</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Data Mode</span>
            <Badge variant={USE_MOCK ? 'warning' : 'info'}>
              {USE_MOCK ? 'Mock Data' : 'Live Data'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Last Updated</span>
            <span className="text-sm text-gray-600">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

