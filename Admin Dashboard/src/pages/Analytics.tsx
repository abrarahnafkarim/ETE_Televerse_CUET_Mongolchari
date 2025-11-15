import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { TrendingUp, MapPin, Award } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { LeaderboardEntry, PopularDestination } from '../types';
import apiService from '../services/api';
import mockApiService from '../services/mockApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const Analytics: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [destinations, setDestinations] = useState<PopularDestination[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const service = USE_MOCK ? mockApiService : apiService;

        const [leaderboardRes, destinationsRes, timeSeriesRes] = await Promise.all([
          service.getLeaderboard(10),
          service.getPopularDestinations(3),
          service.getTimeSeriesData('rides', '', ''),
        ]);

        if (leaderboardRes.success && leaderboardRes.data) {
          setLeaderboard(leaderboardRes.data);
        }

        if (destinationsRes.success && destinationsRes.data) {
          setDestinations(destinationsRes.data);
        }

        if (timeSeriesRes.success && timeSeriesRes.data) {
          setTimeSeriesData(timeSeriesRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const chartData = timeSeriesData
    ? {
        labels: timeSeriesData.map((d: any) =>
          new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        ),
        datasets: [
          {
            label: 'Rides per Hour',
            data: timeSeriesData.map((d: any) => d.value),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3,
          },
        ],
      }
    : null;

  const destinationChartData = destinations.length
    ? {
        labels: destinations.map((d) => d.blockName),
        datasets: [
          {
            label: 'Rides',
            data: destinations.map((d) => d.count),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',  // Blue for Pahartoli
              'rgba(16, 185, 129, 0.8)',  // Green for Noapara
              'rgba(245, 158, 11, 0.8)',  // Orange for Raojan
            ],
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Performance metrics and insights</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Rides Over Time" subtitle="Last 24 hours">
          {chartData ? (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-600">No data available</div>
          )}
        </Card>

        <Card title="Popular Destinations" subtitle="Top 5 dropoff locations">
          {destinationChartData ? (
            <Bar
              data={destinationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-600">No data available</div>
          )}
        </Card>
      </div>

      {/* Leaderboard */}
      <Card
        title="Puller Leaderboard"
        subtitle="Top performers by points"
        action={
          <Badge variant="info">
            <Award size={16} className="mr-1 inline" />
            Top 10
          </Badge>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Rides
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <tr key={entry.pullerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {entry.rank <= 3 ? (
                        <span className="text-2xl">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-lg font-semibold text-gray-600">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.pullerName}
                    </div>
                    <div className="text-xs text-gray-500">{entry.pullerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.rides}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp size={16} className="text-green-500 mr-2" />
                      <span className="text-sm font-semibold text-gray-900">
                        {entry.points.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{entry.rating.toFixed(1)}</span>
                      <span className="ml-1">⭐</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Popular Destinations Detail */}
      <Card title="Destination Breakdown" subtitle="Detailed view of popular locations">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((dest, index) => (
            <div
              key={dest.blockId}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{dest.blockName}</h4>
                </div>
                <Badge variant="info" size="sm">
                  #{index + 1}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Rides:</span> {dest.count}
                </p>
                <p className="text-xs text-gray-600">
                  {dest.latitude.toFixed(4)}, {dest.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

