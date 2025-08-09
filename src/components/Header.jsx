import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, User, Zap, MessageSquare, Settings, LogOut } from 'lucide-react'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/meters', icon: Zap, label: 'Счетчики' },
    { path: '/complaints', icon: MessageSquare, label: 'Обращения' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">
              УК Mini App
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {user.first_name}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Нижняя навигация */}
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Header 