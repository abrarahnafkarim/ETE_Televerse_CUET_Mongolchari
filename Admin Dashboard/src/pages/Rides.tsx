import React, { useEffect, useState } from 'react';
import { Search, Filter, X, MapPin, Clock, User } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import type { Ride, RideFilters } from '../types';
import apiService from '../services/api';
import mockApiService from '../services/mockApi';
import { format } from 'date-fns';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  waiting: 'danger',
  matched: 'warning',
  'in-transit': 'info',
  completed: 'success',
  cancelled: 'default',
};

export const Rides: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<RideFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const service = USE_MOCK ? mockApiService : apiService;
      const response = await service.getRides({ ...filters, searchQuery });

      if (response.success && response.data) {
        setRides(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch rides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [filters, searchQuery]);

  const handleCancelRide = async () => {
    if (!selectedRide || !cancelReason.trim()) return;

    try {
      setActionLoading(true);
      const service = USE_MOCK ? mockApiService : apiService;
      const response = await service.cancelRide(selectedRide.id, cancelReason);

      if (response.success) {
        alert('Ride cancelled successfully');
        setCancelModalOpen(false);
        setSelectedRide(null);
        setCancelReason('');
        fetchRides();
      }
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      alert('Failed to cancel ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (ride: Ride) => {
    setSelectedRide(ride);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ride Management</h1>
          <p className="text-gray-600 mt-1">View and manage all rides</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} className="mr-2" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Status"
              id="status-filter"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'waiting', label: 'Waiting' },
                { value: 'matched', label: 'Matched' },
                { value: 'in-transit', label: 'In Transit' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={filters.status?.[0] || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value ? [e.target.value as any] : undefined,
                })
              }
              fullWidth
            />
            <Input
              label="Date From"
              type="date"
              id="date-from"
              value={filters.dateFrom || ''}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
              fullWidth
            />
            <Input
              label="Date To"
              type="date"
              id="date-to"
              value={filters.dateTo || ''}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
              fullWidth
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                }}
                fullWidth
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            type="text"
            placeholder="Search by ride ID, user, or puller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>
      </Card>

      {/* Rides List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rides.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No rides found</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rides.map((ride) => (
            <Card key={ride.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ride.id}
                    </h3>
                    <Badge variant={statusColors[ride.status]}>
                      {ride.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium">User:</span>
                        <span>{ride.userName}</span>
                      </div>
                      {ride.pullerName && (
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium">Puller:</span>
                          <span>{ride.pullerName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="font-medium">Requested:</span>
                        <span>{format(new Date(ride.requestedAt), 'MMM dd, HH:mm')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-green-500" />
                        <span className="font-medium">Pickup:</span>
                        <span className="truncate">{ride.pickupLocation.address || ride.pickupLocation.blockId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-red-500" />
                        <span className="font-medium">Dropoff:</span>
                        <span className="truncate">{ride.dropoffLocation.address || ride.dropoffLocation.blockId}</span>
                      </div>
                      <div>
                        <span className="font-medium">Points:</span> {ride.points}
                        {ride.distance && (
                          <span className="ml-3">
                            <span className="font-medium">Distance:</span> {ride.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(ride)}
                  >
                    View Details
                  </Button>
                  {(ride.status === 'waiting' || ride.status === 'matched' || ride.status === 'in-transit') && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedRide(ride);
                        setCancelModalOpen(true);
                      }}
                    >
                      Cancel Ride
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ride Details Modal */}
      {selectedRide && !cancelModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRide(null)}
          title={`Ride Details - ${selectedRide.id}`}
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
              <Badge variant={statusColors[selectedRide.status]} size="md">
                {selectedRide.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">User Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedRide.userName}</p>
                  <p><span className="font-medium">ID:</span> {selectedRide.userId}</p>
                </div>
              </div>

              {selectedRide.pullerName && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Puller Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedRide.pullerName}</p>
                    <p><span className="font-medium">ID:</span> {selectedRide.pullerId}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Route</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-green-500 mt-1" />
                  <div>
                    <p className="font-medium">Pickup</p>
                    <p className="text-gray-600">{selectedRide.pickupLocation.address || selectedRide.pickupLocation.blockId}</p>
                    <p className="text-xs text-gray-500">
                      {selectedRide.pickupLocation.latitude.toFixed(4)}, {selectedRide.pickupLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-red-500 mt-1" />
                  <div>
                    <p className="font-medium">Dropoff</p>
                    <p className="text-gray-600">{selectedRide.dropoffLocation.address || selectedRide.dropoffLocation.blockId}</p>
                    <p className="text-xs text-gray-500">
                      {selectedRide.dropoffLocation.latitude.toFixed(4)}, {selectedRide.dropoffLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Timestamps</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Requested:</span> {format(new Date(selectedRide.requestedAt), 'PPpp')}</p>
                {selectedRide.acceptedAt && (
                  <p><span className="font-medium">Accepted:</span> {format(new Date(selectedRide.acceptedAt), 'PPpp')}</p>
                )}
                {selectedRide.completedAt && (
                  <p><span className="font-medium">Completed:</span> {format(new Date(selectedRide.completedAt), 'PPpp')}</p>
                )}
                {selectedRide.cancelledAt && (
                  <p><span className="font-medium">Cancelled:</span> {format(new Date(selectedRide.cancelledAt), 'PPpp')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Points</p>
                <p className="text-2xl font-bold text-gray-900">{selectedRide.points}</p>
              </div>
              {selectedRide.distance && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Distance</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedRide.distance.toFixed(1)} km</p>
                </div>
              )}
              {selectedRide.duration && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedRide.duration} min</p>
                </div>
              )}
            </div>

            {selectedRide.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedRide.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Ride Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setCancelReason('');
        }}
        title="Cancel Ride"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCancelModalOpen(false);
                setCancelReason('');
              }}
            >
              Close
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelRide}
              loading={actionLoading}
              disabled={!cancelReason.trim()}
            >
              Confirm Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel ride <strong>{selectedRide?.id}</strong>?
          </p>
          <Input
            label="Cancellation Reason"
            id="cancel-reason"
            placeholder="Enter reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
};

