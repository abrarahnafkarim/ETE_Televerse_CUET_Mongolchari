import React from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Settings as SettingsIcon, Database, Zap, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
  const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const API_URL = import.meta.env.VITE_API_URL;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">System configuration and information</p>
      </div>

      {/* Configuration */}
      <Card
        title="System Configuration"
        action={<SettingsIcon size={24} className="text-gray-400" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Data Source</p>
                <p className="text-sm text-gray-600">Current data mode</p>
              </div>
            </div>
            <Badge variant={USE_MOCK ? 'warning' : 'success'}>
              {USE_MOCK ? 'Mock Data' : 'Live Backend'}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">API Endpoint</p>
                <p className="text-sm text-gray-600">Backend server URL</p>
              </div>
            </div>
            <code className="text-sm bg-gray-100 px-3 py-1 rounded">
              {API_URL || 'http://localhost:8000'}
            </code>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Mapbox Integration</p>
                <p className="text-sm text-gray-600">Map API configuration</p>
              </div>
            </div>
            <Badge variant={MAPBOX_TOKEN ? 'success' : 'danger'}>
              {MAPBOX_TOKEN ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Environment Variables */}
      <Card title="Environment Variables" subtitle="Required configuration">
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="text-sm text-gray-800">VITE_API_URL</code>
            <p className="text-xs text-gray-600 mt-1">Backend API endpoint URL</p>
            <p className="text-xs text-green-600 mt-1">
              Current: {API_URL || 'http://localhost:8000'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="text-sm text-gray-800">VITE_WS_URL</code>
            <p className="text-xs text-gray-600 mt-1">WebSocket server URL for real-time updates</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="text-sm text-gray-800">VITE_MAPBOX_TOKEN</code>
            <p className="text-xs text-gray-600 mt-1">
              Mapbox API token for map rendering
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Get free token at: https://account.mapbox.com/
            </p>
            <p className="text-xs font-medium mt-1">
              Status: {MAPBOX_TOKEN ? '✓ Configured' : '✗ Missing'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="text-sm text-gray-800">VITE_USE_MOCK_DATA</code>
            <p className="text-xs text-gray-600 mt-1">
              Enable mock data mode (true/false)
            </p>
            <p className="text-xs font-medium mt-1">
              Current: {USE_MOCK ? 'true' : 'false'}
            </p>
          </div>
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card title="Setup Instructions">
        <div className="prose prose-sm max-w-none">
          <ol className="space-y-3">
            <li>
              <strong>Clone and Install:</strong>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">
                <code>
                  {`git clone <repository-url>
cd admin-dashboard
npm install`}
                </code>
              </pre>
            </li>

            <li>
              <strong>Configure Environment:</strong>
              <p className="text-gray-600 mt-1">
                Copy <code>.env.example</code> to <code>.env</code> and update values
              </p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">
                <code>
                  {`cp .env.example .env
# Edit .env with your configuration`}
                </code>
              </pre>
            </li>

            <li>
              <strong>Start Development Server:</strong>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">
                <code>npm run dev</code>
              </pre>
            </li>

            <li>
              <strong>Build for Production:</strong>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">
                <code>npm run build</code>
              </pre>
            </li>

            <li>
              <strong>Docker Deployment:</strong>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">
                <code>
                  {`docker build -t aeras-admin .
docker run -p 3000:80 aeras-admin`}
                </code>
              </pre>
            </li>
          </ol>
        </div>
      </Card>

      {/* Features */}
      <Card title="Dashboard Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Real-time ride monitoring',
            'Interactive map with live updates',
            'User and puller management',
            'Point adjustment with audit trail',
            'Review queue for disputes',
            'Analytics and leaderboard',
            'WebSocket integration',
            'Mock data support',
            'Responsive design',
            'Accessibility compliant',
            'JWT authentication',
            'Role-based access',
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

