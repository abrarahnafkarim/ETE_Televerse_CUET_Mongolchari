import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DashboardStats, Ride, Puller } from '../types';
import websocketService from '../services/websocket';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  stats: DashboardStats | null;
  activePullers: Map<string, Puller>;
  activeRides: Map<string, Ride>;
  connected: boolean;
  updateStats: (stats: Partial<DashboardStats>) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activePullers, setActivePullers] = useState<Map<string, Puller>>(new Map());
  const [activeRides, setActiveRides] = useState<Map<string, Ride>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleConnectionStatus = (status: { connected: boolean }) => {
      setConnected(status.connected);
    };

    const handleStatsUpdate = (data: Partial<DashboardStats>) => {
      setStats((prev) => (prev ? { ...prev, ...data } : null));
    };

    const handlePullerLocation = (data: any) => {
      setActivePullers((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.id);
        if (existing) {
          newMap.set(data.id, {
            ...existing,
            currentLocation: data.location,
            lastActive: data.timestamp,
          });
        }
        return newMap;
      });
    };

    const handleRideUpdate = (ride: Ride) => {
      setActiveRides((prev) => {
        const newMap = new Map(prev);
        if (ride.status === 'completed' || ride.status === 'cancelled') {
          newMap.delete(ride.id);
        } else {
          newMap.set(ride.id, ride);
        }
        return newMap;
      });
    };

    // Subscribe to WebSocket events
    websocketService.on('connection_status', handleConnectionStatus);
    websocketService.on('stats_update', handleStatsUpdate);
    websocketService.on('puller_location', handlePullerLocation);
    websocketService.on('ride_update', handleRideUpdate);

    // Cleanup
    return () => {
      websocketService.off('connection_status', handleConnectionStatus);
      websocketService.off('stats_update', handleStatsUpdate);
      websocketService.off('puller_location', handlePullerLocation);
      websocketService.off('ride_update', handleRideUpdate);
    };
  }, [isAuthenticated]);

  const updateStats = (newStats: Partial<DashboardStats>) => {
    setStats((prev) => (prev ? { ...prev, ...newStats } : null));
  };

  return (
    <RealtimeContext.Provider
      value={{
        stats,
        activePullers,
        activeRides,
        connected,
        updateStats,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

