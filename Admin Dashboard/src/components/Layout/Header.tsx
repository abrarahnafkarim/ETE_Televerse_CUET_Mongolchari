import React from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  const { connected, stats } = useRealtime();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and manage AERAS ride-sharing platform
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Wifi className="text-green-500" size={20} />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="text-red-500" size={20} />
                <span className="text-sm text-red-600 font-medium">Disconnected</span>
              </>
            )}
          </div>

          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Notifications"
          >
            <Bell size={24} className="text-gray-600" />
            {stats && stats.pendingReviews > 0 && (
              <Badge
                variant="danger"
                size="sm"
                className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center"
              >
                {stats.pendingReviews}
              </Badge>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

