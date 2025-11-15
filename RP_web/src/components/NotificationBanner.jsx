import { useAppStore } from '../store/useAppStore'

export default function NotificationBanner() {
  const { systemStatus, connectionStatus, isOnline } = useAppStore()

  if (!isOnline) {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
        ⚠️ No Internet Connection - App is offline
      </div>
    )
  }

  if (connectionStatus === 'disconnected' || connectionStatus === 'connecting') {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
        🔄 Connecting to server...
      </div>
    )
  }

  if (systemStatus === 'warning') {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
        ⚠️ Ride offer expired or timed out
      </div>
    )
  }

  if (systemStatus === 'error') {
    return (
      <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium">
        ❌ System error - Please check connection
      </div>
    )
  }

  return null
}

