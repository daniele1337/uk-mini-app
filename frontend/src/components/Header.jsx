import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Home, 
  User, 
  Activity, 
  MessageSquare, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)

  // Проверяем, работает ли приложение в офлайн режиме
  React.useEffect(() => {
    const checkOnlineStatus = () => {
      const isOffline = !navigator.onLine || localStorage.getItem('offlineMode') === 'true'
      setShowOfflineNotice(isOffline)
    }

    checkOnlineStatus()
    window.addEventListener('online', checkOnlineStatus)
    window.addEventListener('offline', checkOnlineStatus)

    return () => {
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {showOfflineNotice && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-center text-sm text-yellow-800">
            <WifiOff className="w-4 h-4 mr-2" />
            Работаем в офлайн режиме. Данные сохраняются локально.
          </div>
        </div>
      )}
      
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">УК Mini App</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => navigate('/meters')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Activity className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => navigate('/complaints')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header 