import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, X, FileText } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import type { Review } from '../types';
import apiService from '../services/api';
import mockApiService from '../services/mockApi';
import { format } from 'date-fns';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const service = USE_MOCK ? mockApiService : apiService;
      const statusFilter = filter === 'all' ? undefined : filter;
      const response = await service.getReviews(statusFilter);

      if (response.success && response.data) {
        setReviews(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const handleAction = async () => {
    if (!selectedReview || !resolution.trim() || !actionType) return;

    try {
      setActionLoading(true);
      const service = USE_MOCK ? mockApiService : apiService;
      const response =
        actionType === 'approve'
          ? await service.approveReview(selectedReview.id, resolution)
          : await service.rejectReview(selectedReview.id, resolution);

      if (response.success) {
        alert(`Review ${actionType}d successfully`);
        setModalOpen(false);
        setSelectedReview(null);
        setResolution('');
        setActionType(null);
        fetchReviews();
      }
    } catch (error) {
      console.error(`Failed to ${actionType} review:`, error);
      alert(`Failed to ${actionType} review`);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (review: Review, type: 'approve' | 'reject') => {
    setSelectedReview(review);
    setActionType(type);
    setModalOpen(true);
  };

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-gray-600 mt-1">Handle GPS disputes and reports</p>
        </div>
        <Badge variant="danger" size="md">
          {pendingCount} Pending
        </Badge>
      </div>

      {/* Filter Tabs */}
      <Card>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No reviews found</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {review.type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <Badge
                        variant={
                          review.status === 'pending'
                            ? 'warning'
                            : review.status === 'approved'
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {review.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="font-medium text-gray-700">Reporter:</p>
                        <p className="text-gray-600">
                          {review.reporterName} ({review.reporterType})
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Target:</p>
                        <p className="text-gray-600">{review.targetName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Ride ID:</p>
                        <p className="text-gray-600">{review.rideId}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Created:</p>
                        <p className="text-gray-600">
                          {format(new Date(review.createdAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Description:</p>
                      <p className="text-gray-700">{review.description}</p>
                    </div>

                    {review.evidence && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-900 mb-2">Evidence:</p>
                        {review.evidence.gpsData && (
                          <p className="text-sm text-gray-700">
                            GPS Data: {review.evidence.gpsData.length} points
                          </p>
                        )}
                        {review.evidence.screenshots && (
                          <p className="text-sm text-gray-700">
                            Screenshots: {review.evidence.screenshots.length} files
                          </p>
                        )}
                      </div>
                    )}

                    {review.resolution && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-900 mb-2">Resolution:</p>
                        <p className="text-gray-700">{review.resolution}</p>
                        {review.reviewedBy && review.reviewedAt && (
                          <p className="text-sm text-gray-600 mt-2">
                            Reviewed by {review.reviewedBy} on{' '}
                            {format(new Date(review.reviewedAt), 'MMM dd, HH:mm')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {review.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => openActionModal(review, 'approve')}
                      >
                        <Check size={18} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openActionModal(review, 'reject')}
                      >
                        <X size={18} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setResolution('');
          setSelectedReview(null);
          setActionType(null);
        }}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Review`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setResolution('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={handleAction}
              loading={actionLoading}
              disabled={!resolution.trim()}
            >
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-900 mb-2">Review Details:</p>
            <p className="text-sm text-gray-700">
              <strong>Type:</strong> {selectedReview?.type.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Reporter:</strong> {selectedReview?.reporterName}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              {selectedReview?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
              placeholder={`Enter ${
                actionType === 'approve' ? 'resolution details' : 'rejection reason'
              }...`}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

