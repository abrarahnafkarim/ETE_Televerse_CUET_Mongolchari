import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAppStore()

  useEffect(() => {
    // Auto-login with default credentials in development mode
    const autoLogin = async () => {
      const defaultDriverId = 'driver_001'
      const defaultDriverName = 'Test Driver'
      
      try {
        await login(defaultDriverId, defaultDriverName)
        // Navigation will happen automatically via App.jsx routing
      } catch (error) {
        console.error('Auto-login error:', error)
      }
    }

    // Only auto-login if not already authenticated
    if (!isAuthenticated) {
      autoLogin()
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, login, navigate])

  // Show loading state while auto-logging in
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚲</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Rickshaw Puller
        </h1>
        <p className="text-gray-600 mb-6">AERAS Competition System</p>
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Logging in automatically...</p>
      </div>
    </div>
  )
}

