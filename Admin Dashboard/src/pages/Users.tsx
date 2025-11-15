import React, { useEffect, useState } from 'react';
import { Search, UserX, Ban, DollarSign, History } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import type { User, PointAdjustment } from '../types';
import apiService from '../services/api';
import mockApiService from '../services/mockApi';
import { format } from 'date-fns';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Point Adjustment Modal
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [pointAmount, setPointAmount] = useState('');
  const [pointReason, setPointReason] = useState('');
  const [pointHistory, setPointHistory] = useState<PointAdjustment[]>([]);
  const [pointHistoryModalOpen, setPointHistoryModalOpen] = useState(false);
  
  // Ban/Suspend Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'unban' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7');
  
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const service = USE_MOCK ? mockApiService : apiService;
      const response = await service.getUsers({ searchQuery });

      if (response.success && response.data) {
        setUsers(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handlePointAdjustment = async () => {
    if (!selectedUser || !pointAmount || !pointReason.trim()) return;

    try {
      setActionLoading(true);
      const service = USE_MOCK ? mockApiService : apiService;
      const response = await service.adjustPoints(
        selectedUser.id,
        parseInt(pointAmount),
        pointReason
      );

      if (response.success) {
        alert('Points adjusted successfully');
        setPointModalOpen(false);
        setPointAmount('');
        setPointReason('');
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to adjust points:', error);
      alert('Failed to adjust points');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!selectedUser || !actionType || !actionReason.trim()) return;

    try {
      setActionLoading(true);
      const service = USE_MOCK ? mockApiService : apiService;
      
      let response;
      if (actionType === 'suspend') {
        response = await service.suspendUser(selectedUser.id, actionReason, parseInt(suspendDuration));
      } else if (actionType === 'ban') {
        response = await service.banUser(selectedUser.id, actionReason);
      } else {
        response = await service.unbanUser(selectedUser.id);
      }

      if (response.success) {
        alert(`User ${actionType}ned successfully`);
        setActionModalOpen(false);
        setActionType(null);
        setActionReason('');
        fetchUsers();
      }
    } catch (error) {
      console.error(`Failed to ${actionType} user:`, error);
      alert(`Failed to ${actionType} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const viewPointHistory = async (user: User) => {
    setSelectedUser(user);
    setPointHistoryModalOpen(true);

    try {
      const service = USE_MOCK ? mockApiService : apiService;
      const response = await service.getPointAdjustments(user.id);

      if (response.success && response.data) {
        setPointHistory(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch point history:', error);
    }
  };

  const openActionModal = (user: User, type: 'suspend' | 'ban' | 'unban') => {
    setSelectedUser(user);
    setActionType(type);
    setActionModalOpen(true);
  };

  const openPointModal = (user: User) => {
    setSelectedUser(user);
    setPointModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage users, pullers, and points</p>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No users found</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">
                    {user.name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.name}
                      </h3>
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'success'
                            : user.status === 'suspended'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {user.status}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {user.role}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>{' '}
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>{' '}
                        <span className="text-gray-900">{user.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Block:</span>{' '}
                        <span className="text-gray-900">{user.blockId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Points:</span>{' '}
                        <span className="font-semibold text-primary-600">
                          {user.points}
                        </span>
                      </div>
                    </div>

                    {user.lastActive && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last active: {format(new Date(user.lastActive), 'MMM dd, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPointModal(user)}
                    title="Adjust Points"
                  >
                    <DollarSign size={18} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewPointHistory(user)}
                    title="View History"
                  >
                    <History size={18} />
                  </Button>
                  {user.status === 'active' ? (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openActionModal(user, 'suspend')}
                        title="Suspend User"
                      >
                        <UserX size={18} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openActionModal(user, 'ban')}
                        title="Ban User"
                      >
                        <Ban size={18} />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openActionModal(user, 'unban')}
                      title="Unban User"
                    >
                      Unban
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Point Adjustment Modal */}
      <Modal
        isOpen={pointModalOpen}
        onClose={() => {
          setPointModalOpen(false);
          setPointAmount('');
          setPointReason('');
        }}
        title="Adjust Points"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setPointModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePointAdjustment}
              loading={actionLoading}
              disabled={!pointAmount || !pointReason.trim()}
            >
              Adjust Points
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>User:</strong> {selectedUser?.name}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Current Points:</strong>{' '}
              <span className="font-semibold text-primary-600">
                {selectedUser?.points}
              </span>
            </p>
          </div>

          <Input
            label="Point Amount"
            type="number"
            id="point-amount"
            placeholder="Enter amount (use negative for deduction)"
            value={pointAmount}
            onChange={(e) => setPointAmount(e.target.value)}
            helperText="Use positive number to add points, negative to deduct"
            required
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              placeholder="Enter reason for adjustment..."
              value={pointReason}
              onChange={(e) => setPointReason(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium">Note:</p>
            <p className="text-sm text-blue-700">
              All point adjustments are logged with an audit trail including timestamp,
              admin details, and reason.
            </p>
          </div>
        </div>
      </Modal>

      {/* Point History Modal */}
      <Modal
        isOpen={pointHistoryModalOpen}
        onClose={() => {
          setPointHistoryModalOpen(false);
          setPointHistory([]);
        }}
        title={`Point History - ${selectedUser?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          {pointHistory.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No point adjustment history found
            </p>
          ) : (
            pointHistory.map((adjustment) => (
              <div
                key={adjustment.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge
                      variant={adjustment.amount > 0 ? 'success' : 'danger'}
                      size="md"
                    >
                      {adjustment.amount > 0 ? '+' : ''}
                      {adjustment.amount} points
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600">
                    {format(new Date(adjustment.timestamp), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  <strong>Reason:</strong> {adjustment.reason}
                </p>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Previous:</span>{' '}
                    <span className="font-semibold">{adjustment.previousBalance}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">New:</span>{' '}
                    <span className="font-semibold">{adjustment.newBalance}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Admin:</span>{' '}
                    <span>{adjustment.adminName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Ban/Suspend Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setActionType(null);
          setActionReason('');
        }}
        title={
          actionType === 'suspend'
            ? 'Suspend User'
            : actionType === 'ban'
            ? 'Ban User'
            : 'Unban User'
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setActionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'unban' ? 'success' : 'danger'}
              onClick={handleUserAction}
              loading={actionLoading}
              disabled={actionType !== 'unban' && !actionReason.trim()}
            >
              Confirm {actionType}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-900 font-medium">Warning:</p>
            <p className="text-sm text-yellow-800">
              {actionType === 'ban'
                ? 'Banning a user will permanently restrict their access to the platform.'
                : actionType === 'suspend'
                ? 'Suspending a user will temporarily restrict their access.'
                : 'This will restore user access to the platform.'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>User:</strong> {selectedUser?.name}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {selectedUser?.email}
            </p>
          </div>

          {actionType !== 'unban' && (
            <>
              {actionType === 'suspend' && (
                <Input
                  label="Suspension Duration (days)"
                  type="number"
                  id="suspend-duration"
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(e.target.value)}
                  required
                  fullWidth
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                  placeholder="Enter reason..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

