import React, { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('https://24autoflow.ru/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.log('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`https://24autoflow.ru/api/notifications/${id}/read`, {
        method: 'POST'
      })
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.log('Error marking notification as read:', error)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Уведомления
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Нет новых уведомлений
            </p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Отметить как прочитанное
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
