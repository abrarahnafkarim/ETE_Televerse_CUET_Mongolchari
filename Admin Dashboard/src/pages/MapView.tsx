import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { MapPin, Navigation, Circle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import type { Ride, Puller, Location } from '../types';
import apiService from '../services/api';
import mockApiService from '../services/mockApi';
import { MOCK_RIDES, MOCK_PULLERS } from '../mock/mockData';
import { useRealtime } from '../contexts/RealtimeContext';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Fallback to OpenStreetMap if no Mapbox token
const MAP_STYLE = MAPBOX_TOKEN
  ? 'mapbox://styles/mapbox/streets-v12'
  : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const KAMPALA_CENTER = { latitude: 0.3476, longitude: 32.5825 };

interface RideMarkerProps {
  ride: Ride;
  onClick: (ride: Ride) => void;
}

const RideMarker: React.FC<RideMarkerProps> = ({ ride, onClick }) => {
  const color = {
    waiting: '#EF4444',
    matched: '#F59E0B',
    'in-transit': '#3B82F6',
    completed: '#10B981',
    cancelled: '#6B7280',
  }[ride.status];

  return (
    <Marker
      latitude={ride.pickupLocation.latitude}
      longitude={ride.pickupLocation.longitude}
      anchor="bottom"
      onClick={() => onClick(ride)}
    >
      <div
        className="cursor-pointer transform hover:scale-110 transition-transform"
        title={`Ride ${ride.id} - ${ride.status}`}
      >
        <MapPin size={32} color={color} fill={color} />
      </div>
    </Marker>
  );
};

interface PullerMarkerProps {
  puller: Puller;
  onClick: (puller: Puller) => void;
}

const PullerMarker: React.FC<PullerMarkerProps> = ({ puller, onClick }) => {
  const color = puller.status === 'online' ? '#10B981' : puller.status === 'busy' ? '#F59E0B' : '#6B7280';

  return (
    <Marker
      latitude={puller.currentLocation.latitude}
      longitude={puller.currentLocation.longitude}
      anchor="center"
      onClick={() => onClick(puller)}
    >
      <div
        className="cursor-pointer transform hover:scale-110 transition-transform relative"
        title={`${puller.name} - ${puller.status}`}
      >
        <div
          className="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Navigation size={20} color="white" />
        </div>
        {puller.status === 'online' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>
    </Marker>
  );
};

export const MapView: React.FC = () => {
  const { activePullers, activeRides } = useRealtime();
  const [rides, setRides] = useState<Ride[]>(USE_MOCK ? MOCK_RIDES : []);
  const [pullers, setPullers] = useState<Puller[]>(USE_MOCK ? MOCK_PULLERS : []);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [selectedPuller, setSelectedPuller] = useState<Puller | null>(null);
  const [viewport, setViewport] = useState({
    latitude: KAMPALA_CENTER.latitude,
    longitude: KAMPALA_CENTER.longitude,
    zoom: 13,
  });

  useEffect(() => {
    if (!USE_MOCK) {
      const fetchData = async () => {
        try {
          const [ridesRes, pullersRes] = await Promise.all([
            apiService.getRides({ status: ['waiting', 'in-transit', 'matched'] }),
            apiService.getPullers(),
          ]);

          if (ridesRes.success && ridesRes.data) {
            setRides(ridesRes.data.items);
          }
          if (pullersRes.success && pullersRes.data) {
            setPullers(pullersRes.data.items.filter((p) => p.status !== 'offline'));
          }
        } catch (error) {
          console.error('Failed to fetch map data:', error);
        }
      };

      fetchData();
      const interval = setInterval(fetchData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, []);

  // Update from realtime context
  useEffect(() => {
    if (activeRides.size > 0) {
      setRides((prev) => {
        const updated = [...prev];
        activeRides.forEach((ride) => {
          const index = updated.findIndex((r) => r.id === ride.id);
          if (index >= 0) {
            updated[index] = ride;
          } else {
            updated.push(ride);
          }
        });
        return updated.filter((r) => r.status === 'waiting' || r.status === 'in-transit' || r.status === 'matched');
      });
    }
  }, [activeRides]);

  useEffect(() => {
    if (activePullers.size > 0) {
      setPullers((prev) => {
        const updated = [...prev];
        activePullers.forEach((puller) => {
          const index = updated.findIndex((p) => p.id === puller.id);
          if (index >= 0) {
            updated[index] = puller;
          } else {
            updated.push(puller);
          }
        });
        return updated;
      });
    }
  }, [activePullers]);

  const activeRideCount = rides.filter((r) => r.status === 'in-transit' || r.status === 'matched').length;
  const waitingRideCount = rides.filter((r) => r.status === 'waiting').length;
  const onlinePullerCount = pullers.filter((p) => p.status === 'online').length;

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Map</h1>
          <p className="text-gray-600 mt-1">Real-time tracking of rides and pullers</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="success">
            {onlinePullerCount} Pullers Online
          </Badge>
          <Badge variant="info">
            {activeRideCount} Active Rides
          </Badge>
          <Badge variant="warning">
            {waitingRideCount} Waiting
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Map Container */}
        <div className="col-span-3">
          <Card noPadding className="h-[calc(100vh-250px)]">
            {MAPBOX_TOKEN || true ? (
              <Map
                {...viewport}
                onMove={(evt) => setViewport(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAP_STYLE}
                mapboxAccessToken={MAPBOX_TOKEN || undefined}
              >
                <NavigationControl position="top-right" />

                {/* Ride Markers */}
                {rides.map((ride) => (
                  <RideMarker key={ride.id} ride={ride} onClick={setSelectedRide} />
                ))}

                {/* Puller Markers */}
                {pullers.map((puller) => (
                  <PullerMarker key={puller.id} puller={puller} onClick={setSelectedPuller} />
                ))}

                {/* GPS Path for selected ride */}
                {selectedRide?.gpsPath && selectedRide.gpsPath.length > 0 && (
                  <Source
                    type="geojson"
                    data={{
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: selectedRide.gpsPath.map((p) => [p.longitude, p.latitude]),
                      },
                    }}
                  >
                    <Layer
                      id="route"
                      type="line"
                      paint={{
                        'line-color': '#3B82F6',
                        'line-width': 4,
                      }}
                    />
                  </Source>
                )}
              </Map>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Map requires Mapbox token</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Set VITE_MAPBOX_TOKEN in .env file
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          <Card title="Legend">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Circle size={16} fill="#EF4444" color="#EF4444" />
                <span className="text-sm">Waiting</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle size={16} fill="#F59E0B" color="#F59E0B" />
                <span className="text-sm">Matched</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle size={16} fill="#3B82F6" color="#3B82F6" />
                <span className="text-sm">In Transit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span className="text-sm">Puller Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                <span className="text-sm">Puller Busy</span>
              </div>
            </div>
          </Card>

          {selectedRide && (
            <Card title="Selected Ride">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {selectedRide.id}
                </div>
                <div>
                  <span className="font-medium">User:</span> {selectedRide.userName}
                </div>
                <div>
                  <span className="font-medium">Puller:</span>{' '}
                  {selectedRide.pullerName || 'Not assigned'}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge
                    variant={
                      selectedRide.status === 'waiting'
                        ? 'danger'
                        : selectedRide.status === 'in-transit'
                        ? 'info'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {selectedRide.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Points:</span> {selectedRide.points}
                </div>
                {selectedRide.distance && (
                  <div>
                    <span className="font-medium">Distance:</span> {selectedRide.distance.toFixed(1)} km
                  </div>
                )}
              </div>
            </Card>
          )}

          {selectedPuller && (
            <Card title="Selected Puller">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedPuller.name}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge
                    variant={selectedPuller.status === 'online' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {selectedPuller.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Total Rides:</span> {selectedPuller.totalRides}
                </div>
                <div>
                  <span className="font-medium">Points:</span> {selectedPuller.totalPoints}
                </div>
                <div>
                  <span className="font-medium">Rating:</span> {selectedPuller.rating.toFixed(1)} ⭐
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

