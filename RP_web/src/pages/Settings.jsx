import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import storage from '../services/storage'
import { config } from '../config'

export default function Settings() {
  const navigate = useNavigate()
  const { driver, logout, isOnline, connectionStatus } = useAppStore()
  
  const [settings, setSettings] = useState({
    gpsUpdateInterval: 5000,
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
  })

  useEffect(() => {
    const savedSettings = storage.getSettings()
    setSettings(savedSettings)
  }, [])

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    storage.saveSettings(newSettings)
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
          <div className="w-12"></div>
        </div>
      </div>

      {/* Driver Info */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Driver Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Name</p>
              <p className="text-sm font-medium text-gray-900">{driver?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Driver ID</p>
              <p className="text-sm font-medium text-gray-900">{driver?.id || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Network Status</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-success-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-gray-900">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Server Connection</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-success-500'
                      : connectionStatus === 'connecting'
                      ? 'bg-warning-500'
                      : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-gray-900">
                  {connectionStatus === 'connected'
                    ? 'Connected'
                    : connectionStatus === 'connecting'
                    ? 'Connecting'
                    : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-4">App Settings</h2>
          <div className="space-y-4">
            {/* GPS Update Interval */}
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">GPS Update Interval</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Current: {settings.gpsUpdateInterval / 1000}s
                  </p>
                </div>
                <select
                  value={settings.gpsUpdateInterval}
                  onChange={(e) =>
                    updateSetting('gpsUpdateInterval', parseInt(e.target.value))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds (Recommended)</option>
                  <option value={10000}>10 seconds</option>
                  <option value={15000}>15 seconds</option>
                </select>
              </label>
            </div>

            {/* Sound Notifications */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-sm font-medium text-gray-900">Sound Notifications</p>
                <p className="text-xs text-gray-600 mt-1">Play sound for ride offers</p>
              </div>
              <button
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-sm font-medium text-gray-900">Vibration</p>
                <p className="text-xs text-gray-600 mt-1">Vibrate on notifications</p>
              </div>
              <button
                onClick={() =>
                  updateSetting('vibrationEnabled', !settings.vibrationEnabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.vibrationEnabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-sm font-medium text-gray-900">Notifications</p>
                <p className="text-xs text-gray-600 mt-1">Show ride notifications</p>
              </div>
              <button
                onClick={() =>
                  updateSetting('notificationsEnabled', !settings.notificationsEnabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Rickshaw Puller App</p>
            <p>AERAS Competition System</p>
            <p className="text-xs text-gray-500 mt-4">Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mb-6">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 active:bg-red-800"
        >
          Logout
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around px-4 py-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate('/points')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl">💰</span>
            <span className="text-xs font-medium">Points</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-primary-600"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

